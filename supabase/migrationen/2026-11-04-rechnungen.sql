-- 04.11.2026: Buchungsbestaetigung mit Rechnung (PDF) per Mail.
-- Rechnungsnummern fortlaufend und eindeutig, vergeben erst wenn die
-- Rechnung entsteht (nach der Zahlung), damit stornierte Anfragen keine
-- Luecken in den Rechnungsnummern hinterlassen.
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

create sequence if not exists rechnungsnummer_seq;

alter table buchungen
  add column if not exists rechnungsnummer text unique,
  add column if not exists rechnung_am date,
  add column if not exists bestaetigung_gesendet_am timestamptz;

-- Rechnungsnummer vergeben (oder die schon vergebene zurueckgeben).
-- Format: Jahr und fortlaufende Nummer, z. B. 2026-0001 (die Nummer zaehlt ueber Jahre weiter).
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

revoke execute on function rechnung_vergeben(uuid) from public, anon, authenticated;
grant  execute on function rechnung_vergeben(uuid) to service_role;
