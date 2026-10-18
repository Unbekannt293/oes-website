-- 18.10.2026: Kaution bar oder per Ueberweisung (nie online).
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

alter table buchungen
  add column if not exists kaution_zahlart text not null default 'bar'
  check (kaution_zahlart in ('bar', 'ueberweisung'));

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
                              entfernung_km, zahlungsart, notiz)
  select x.vorname, x.nachname, x.email, x.telefon, x.strasse, x.plz, x.ort, x.adresszusatz,
         x.von, x.bis, x.summe_cent, coalesce(x.fahrtkosten_cent, 0), coalesce(x.kaution_cent, 0),
         coalesce(x.kaution_zahlart, 'bar'),
         x.entfernung_km, coalesce(x.zahlungsart, 'ueberweisung'), x.notiz
    from jsonb_to_record(p_buchung) as x(
           vorname text, nachname text, email text, telefon text, strasse text, plz text, ort text,
           adresszusatz text, von date, bis date, summe_cent int, fahrtkosten_cent int,
           kaution_cent int, kaution_zahlart text, entfernung_km numeric, zahlungsart text, notiz text)
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
