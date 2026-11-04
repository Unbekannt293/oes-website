-- 04.11.2026: Zahlungsfrist fuer Ueberweisungen (shared/zahlungsfrist.ts).
-- zahlung_bis: letzter Tag fuer den Zahlungseingang, beim Bestellen gesetzt,
--   in der Verwaltung verlaengerbar. Leer bei Online-Zahlung und bei alten
--   Buchungen (dann rechnet der Server die Frist aus erstellt_am und von).
-- zahlungserinnerung_am: wann die Erinnerung rausging (hoechstens einmal).
-- vorgewarnt_am: wann Louis morgens vorgewarnt wurde. Kunden-Mails gehen
--   erst 4 Stunden danach raus, damit er vorher noch abhaken kann.
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

alter table buchungen add column if not exists zahlung_bis date;
alter table buchungen add column if not exists zahlungserinnerung_am timestamptz;
alter table buchungen add column if not exists vorgewarnt_am timestamptz;

-- Die taegliche Pruefung sucht nur offene Ueberweisungen.
create index if not exists buchungen_offen_idx on buchungen (zahlungsart, status)
  where bezahlt_am is null;
