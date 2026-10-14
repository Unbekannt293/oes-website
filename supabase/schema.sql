-- ============================================================
-- OES Buchungssystem: Schema fuer Supabase (Postgres)
--
-- Einmal im Supabase SQL Editor ausfuehren. Es kann gefahrlos
-- erneut laufen, solange die Tabellen noch leer sind.
--
-- Grundidee:
--   inventar     wie viele Geraete es gibt (1 Fotobox, 2 Soundboxen)
--   buchungen    eine Buchung mit Kunde, Zeitraum, Preisen, Status
--   positionen   was gebucht wurde (fuer Rechnung und Uebersicht)
--   belegungen   welches Geraet an welchen Tagen weg ist. Auch Sperren
--                ohne Buchung (Kleinanzeigen, Wartung) stehen hier,
--                dann ist buchung_id leer.
--
-- Verfuegbarkeit wird nie gespeichert, sondern immer aus Inventar
-- und Belegungen berechnet (freie_geraete). Neue Buchungen laufen
-- ausschliesslich ueber buchung_anlegen, das in einer Transaktion
-- prueft und eintraegt. So gibt es keine Doppelbuchungen.
-- ============================================================

-- ---------- Inventar ----------
create table if not exists inventar (
  slug     text primary key,              -- wie im Katalog: 'fotobox', 'soundbox'
  name     text not null,
  bestand  int  not null check (bestand >= 0)
);

insert into inventar (slug, name, bestand) values
  ('fotobox',  'Fotobox',  1),
  ('soundbox', 'Soundbox', 2)
on conflict (slug) do nothing;

-- ---------- Buchungen ----------
do $$ begin
  create type buchungsstatus as enum ('angefragt', 'bestaetigt', 'storniert');
exception when duplicate_object then null; end $$;

create sequence if not exists buchungsnummer_seq;

create table if not exists buchungen (
  id            uuid primary key default gen_random_uuid(),
  -- Lesbare Nummer fuer Mails und Telefon, z. B. OES-2026-0007
  nummer        text unique not null
                default 'OES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('buchungsnummer_seq')::text, 4, '0'),
  status        buchungsstatus not null default 'angefragt',
  erstellt_am   timestamptz not null default now(),

  -- Kunde und Lieferung
  vorname       text not null,
  nachname      text not null,
  email         text not null,
  telefon       text not null,
  strasse       text not null,
  plz           text not null,
  ort           text not null,
  adresszusatz  text,

  -- Zeitraum der ganzen Buchung (erster bis letzter Miettag)
  von           date not null,
  bis           date not null,
  check (bis >= von),

  -- Alle Betraege in Cent und vom Server berechnet, nie vom Browser.
  summe_cent        int not null check (summe_cent >= 0),
  fahrtkosten_cent  int not null default 0 check (fahrtkosten_cent >= 0),
  kaution_cent      int not null default 0 check (kaution_cent >= 0),
  entfernung_km     numeric(6, 1),

  zahlungsart          text not null default 'ueberweisung',
  bezahlt_am           timestamptz,
  kaution_erhalten_am  timestamptz,
  kaution_zurueck_am   timestamptz,
  notiz                text            -- interne Notiz fuer Louis
);

create index if not exists buchungen_von_idx on buchungen (von);

-- ---------- Positionen ----------
create table if not exists positionen (
  id               bigint generated always as identity primary key,
  buchung_id       uuid not null references buchungen (id) on delete cascade,
  art              text not null check (art in ('paket', 'produkt', 'zubehoer')),
  slug             text not null,
  name             text not null,
  detail           text,
  menge            int  not null default 1 check (menge > 0),
  einzelpreis_cent int  not null check (einzelpreis_cent >= 0)
);

create index if not exists positionen_buchung_idx on positionen (buchung_id);

-- ---------- Belegungen und Sperren ----------
create table if not exists belegungen (
  id          bigint generated always as identity primary key,
  -- leer = Sperre ohne Buchung (z. B. ueber Kleinanzeigen vermietet)
  buchung_id  uuid references buchungen (id) on delete cascade,
  geraet      text not null references inventar (slug),
  anzahl      int  not null check (anzahl > 0),
  -- Tage einschliesslich: '[2026-12-11,2026-12-13]' = Fr bis So
  zeitraum    daterange not null check (not isempty(zeitraum)),
  grund       text
);

create index if not exists belegungen_geraet_idx   on belegungen (geraet);
create index if not exists belegungen_zeitraum_idx on belegungen using gist (zeitraum);

-- ============================================================
-- Freie Geraete je Tag. Stornierte Buchungen zaehlen nicht, offene
-- Anfragen schon: sonst koennte waehrend Louis' Pruefung jemand
-- anders dasselbe Geraet buchen.
-- ============================================================
create or replace function freie_geraete(p_geraet text, p_von date, p_bis date)
returns table (tag date, frei int)
language sql stable
as $$
  select d::date as tag,
         (i.bestand - coalesce(sum(b.anzahl), 0))::int as frei
    from generate_series(p_von, p_bis, interval '1 day') as d
    join inventar i on i.slug = p_geraet
    left join belegungen b
      on b.geraet = p_geraet
     and b.zeitraum @> d::date
     and (b.buchung_id is null
          or exists (select 1 from buchungen x
                      where x.id = b.buchung_id and x.status <> 'storniert'))
   group by d, i.bestand
   order by d;
$$;

-- ============================================================
-- Buchung anlegen: alles oder nichts.
--
-- p_buchung     Kunde, Zeitraum, Betraege (ein Objekt)
-- p_positionen  Liste der Positionen
-- p_belegungen  Liste {geraet, anzahl, von, bis}
--
-- Ablauf: die betroffenen Geraete im Inventar sperren (parallele
-- Buchungen derselben Geraete warten hier), alles eintragen, dann
-- pruefen, ob an irgendeinem Tag mehr belegt ist als vorhanden.
-- Wenn ja, bricht die Funktion ab und nichts bleibt gespeichert.
-- ============================================================
create or replace function buchung_anlegen(p_buchung jsonb, p_positionen jsonb, p_belegungen jsonb)
returns table (id uuid, nummer text)
language plpgsql
as $$
declare
  v_id      uuid;
  v_nummer  text;
  v_knapp   record;
begin
  if jsonb_array_length(p_belegungen) = 0 then
    raise exception 'keine_belegung' using errcode = 'P0001';
  end if;

  perform 1 from inventar
   where slug in (select e->>'geraet' from jsonb_array_elements(p_belegungen) e)
   order by slug
   for update;

  insert into buchungen as b (vorname, nachname, email, telefon, strasse, plz, ort, adresszusatz,
                              von, bis, summe_cent, fahrtkosten_cent, kaution_cent, entfernung_km,
                              zahlungsart, notiz)
  select x.vorname, x.nachname, x.email, x.telefon, x.strasse, x.plz, x.ort, x.adresszusatz,
         x.von, x.bis, x.summe_cent, coalesce(x.fahrtkosten_cent, 0), coalesce(x.kaution_cent, 0),
         x.entfernung_km, coalesce(x.zahlungsart, 'ueberweisung'), x.notiz
    from jsonb_to_record(p_buchung) as x(
           vorname text, nachname text, email text, telefon text, strasse text, plz text, ort text,
           adresszusatz text, von date, bis date, summe_cent int, fahrtkosten_cent int,
           kaution_cent int, entfernung_km numeric, zahlungsart text, notiz text)
  returning b.id, b.nummer into v_id, v_nummer;

  insert into positionen (buchung_id, art, slug, name, detail, menge, einzelpreis_cent)
  select v_id, x.art, x.slug, x.name, x.detail, coalesce(x.menge, 1), x.einzelpreis_cent
    from jsonb_to_recordset(p_positionen) as x(
           art text, slug text, name text, detail text, menge int, einzelpreis_cent int);

  insert into belegungen (buchung_id, geraet, anzahl, zeitraum)
  select v_id, x.geraet, x.anzahl, daterange(x.von, x.bis, '[]')
    from jsonb_to_recordset(p_belegungen) as x(geraet text, anzahl int, von date, bis date);

  -- Zaehlt alle Belegungen inklusive der gerade eingetragenen.
  select n.geraet, f.tag into v_knapp
    from (select distinct bl.geraet, lower(bl.zeitraum) as von, upper(bl.zeitraum) - 1 as bis
            from belegungen bl where bl.buchung_id = v_id) n
    cross join lateral freie_geraete(n.geraet, n.von, n.bis) f
   where f.frei < 0
   order by f.tag
   limit 1;

  if found then
    raise exception 'nicht_verfuegbar:%:%', v_knapp.geraet, v_knapp.tag using errcode = 'P0001';
  end if;

  return query select v_id, v_nummer;
end;
$$;

-- ============================================================
-- Zugriff: nur der Server (Secret Key) darf lesen und schreiben.
-- RLS an und keine Policies heisst: der oeffentliche Schluessel
-- sieht nichts. Der Secret Key umgeht RLS.
-- ============================================================
alter table inventar   enable row level security;
alter table buchungen  enable row level security;
alter table positionen enable row level security;
alter table belegungen enable row level security;

revoke execute on function freie_geraete(text, date, date)          from public, anon, authenticated;
revoke execute on function buchung_anlegen(jsonb, jsonb, jsonb)     from public, anon, authenticated;
grant  execute on function freie_geraete(text, date, date)          to service_role;
grant  execute on function buchung_anlegen(jsonb, jsonb, jsonb)     to service_role;
