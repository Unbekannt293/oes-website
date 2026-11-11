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
  -- Kaution nie online (Kartengebuehren), nur bar oder per Ueberweisung.
  kaution_zahlart   text not null default 'bar' check (kaution_zahlart in ('bar', 'ueberweisung')),
  -- Fotobox immer Lieferung, Soundbox auch Selbstabholung (Mietbedingungen § 9).
  uebergabe         text not null default 'lieferung' check (uebergabe in ('lieferung', 'abholung')),
  entfernung_km     numeric(6, 1),

  zahlungsart          text not null default 'ueberweisung',
  bezahlt_am           timestamptz,
  kaution_erhalten_am  timestamptz,
  kaution_zurueck_am   timestamptz,
  notiz                text,           -- interne Notiz fuer Louis
  -- Rechnung (supabase/migrationen/2026-11-04-rechnungen.sql)
  rechnungsnummer          text unique,
  rechnung_am              date,
  bestaetigung_gesendet_am timestamptz,
  -- Zahlungsfrist Ueberweisung (supabase/migrationen/2026-11-04-zahlungsfrist.sql)
  zahlung_bis              date,
  zahlungserinnerung_am    timestamptz,
  vorgewarnt_am            timestamptz,  -- Louis morgens vorgewarnt, Kunden-Mails 4 h spaeter
  -- Angaben an der Kasse (supabase/migrationen/2026-11-11-kasse.sql)
  kundenart                text not null default 'privat' check (kundenart in ('privat', 'firma')),
  firma                    text,
  ust_id                   text,
  anlass                   text,
  anlass_text              text,
  layouts                  text[] not null default '{}',
  logo_pfad                text,          -- Storage-Bucket "logos" (privat)
  widerruf_zustimmung_am   timestamptz
);

create index if not exists buchungen_von_idx on buchungen (von);
create index if not exists buchungen_offen_idx on buchungen (zahlungsart, status)
  where bezahlt_am is null;

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
-- Beide Funktionen haben einen festen search_path: sonst koennte ein
-- gleichnamiges Objekt in einem anderen Schema untergeschoben werden
-- (Supabase Security Advisor: "Function Search Path Mutable").
--
-- Freie Geraete je Tag. Stornierte Buchungen zaehlen nicht, offene
-- Anfragen schon: sonst koennte waehrend Louis' Pruefung jemand
-- anders dasselbe Geraet buchen.
-- ============================================================
create or replace function freie_geraete(p_geraet text, p_von date, p_bis date)
returns table (tag date, frei int)
language sql stable
set search_path = public
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
set search_path = public
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
                              von, bis, summe_cent, fahrtkosten_cent, kaution_cent, kaution_zahlart,
                              entfernung_km, zahlungsart, notiz, uebergabe)
  select x.vorname, x.nachname, x.email, x.telefon, x.strasse, x.plz, x.ort, x.adresszusatz,
         x.von, x.bis, x.summe_cent, coalesce(x.fahrtkosten_cent, 0), coalesce(x.kaution_cent, 0),
         coalesce(x.kaution_zahlart, 'bar'),
         x.entfernung_km, coalesce(x.zahlungsart, 'ueberweisung'), x.notiz,
         coalesce(x.uebergabe, 'lieferung')
    from jsonb_to_record(p_buchung) as x(
           vorname text, nachname text, email text, telefon text, strasse text, plz text, ort text,
           adresszusatz text, von date, bis date, summe_cent int, fahrtkosten_cent int,
           kaution_cent int, kaution_zahlart text, entfernung_km numeric, zahlungsart text, notiz text,
           uebergabe text)
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

-- ---------- Rechnungsnummern ----------
-- Fortlaufend, erst wenn die Rechnung entsteht (nach der Zahlung).
create sequence if not exists rechnungsnummer_seq;
create or replace function rechnung_vergeben(p_id uuid)
returns table (nummer text, datum date)
language plpgsql
set search_path = public
as $$
begin
  update buchungen b
     set rechnungsnummer = to_char(now() at time zone 'Europe/Berlin', 'YYYY') || '-' || lpad(nextval('rechnungsnummer_seq')::text, 4, '0'),
         rechnung_am = (now() at time zone 'Europe/Berlin')::date
   where b.id = p_id and b.rechnungsnummer is null;
  return query select b.rechnungsnummer, b.rechnung_am from buchungen b where b.id = p_id;
end;
$$;

-- ---------- Bewertungen ----------
-- Neue Bewertungen sind unsichtbar, bis Louis sie freischaltet (Link in
-- der Benachrichtigungsmail oder freigegeben = true im Table Editor).
create table if not exists bewertungen (
  id             uuid primary key default gen_random_uuid(),
  erstellt_am    timestamptz not null default now(),
  name           text not null check (char_length(name) between 2 and 60),
  sterne         smallint not null check (sterne between 1 and 5),
  text           text not null check (char_length(text) between 10 and 1000),
  -- null = allgemein, sonst Produkt bzw. Komplettpaket (Slug aus dem Katalog)
  bezug          text,
  freigegeben    boolean not null default false,
  freigegeben_am timestamptz,
  freigabe_token uuid not null default gen_random_uuid(),
  -- Pfade im Storage-Bucket "bewertungen" (2026-11-05-bewertungsbilder.sql)
  bilder         text[] not null default '{}' check (coalesce(array_length(bilder, 1), 0) <= 3)
);
create index if not exists bewertungen_sichtbar on bewertungen (erstellt_am desc) where freigegeben;

-- Erlaubte Bezuege als eigene Regel, damit sie sich spaeter austauschen laesst.
alter table bewertungen drop constraint if exists bewertungen_bezug_check;
alter table bewertungen add constraint bewertungen_bezug_check
  check (bezug in ('fotobox', 'soundbox', 'kombi-fotobox-soundbox', 'kombi-fotobox-2-soundboxen'));

-- ---------- Preise ----------
-- Nur Abweichungen vom Standard in shared/catalog.ts. Ohne Zeitraum
-- dauerhaft, mit Zeitraum Aktionspreis fuer Buchungen in diesem Zeitraum.
create table if not exists preise (
  id           bigint generated always as identity primary key,
  schluessel   text not null,
  wert         int  not null check (wert >= 0),   -- Cent, bei km-Angaben km
  gueltig_von  date,
  gueltig_bis  date,
  erstellt_am  timestamptz not null default now(),
  check ((gueltig_von is null) = (gueltig_bis is null)),
  check (gueltig_bis is null or gueltig_bis >= gueltig_von)
);
create unique index if not exists preise_dauerhaft on preise (schluessel) where gueltig_von is null;

-- ============================================================
-- Zugriff: nur der Server (Secret Key) darf lesen und schreiben.
-- RLS an und keine Policies heisst: der oeffentliche Schluessel
-- sieht nichts. Der Secret Key umgeht RLS.
-- ============================================================
alter table inventar   enable row level security;
alter table buchungen  enable row level security;
alter table positionen enable row level security;
alter table belegungen enable row level security;
alter table bewertungen enable row level security;
alter table preise      enable row level security;

revoke execute on function freie_geraete(text, date, date)          from public, anon, authenticated;
revoke execute on function buchung_anlegen(jsonb, jsonb, jsonb)     from public, anon, authenticated;
grant  execute on function freie_geraete(text, date, date)          to service_role;
grant  execute on function buchung_anlegen(jsonb, jsonb, jsonb)     to service_role;
revoke execute on function rechnung_vergeben(uuid) from public, anon, authenticated;
grant  execute on function rechnung_vergeben(uuid) to service_role;
