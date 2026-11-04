-- 31.10.2026: Preise in der Verwaltung aenderbar (/admin/preise).
-- Hier stehen nur Abweichungen vom Standard in shared/catalog.ts:
--   ohne Zeitraum  = dauerhafter neuer Preis (je Preis hoechstens einer)
--   mit Zeitraum   = Aktionspreis fuer Buchungen, die von .. bis eingehen
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

create table if not exists preise (
  id           bigint generated always as identity primary key,
  schluessel   text not null,                 -- z. B. 'paket.fotobox-basic', 'lieferung.km'
  wert         int  not null check (wert >= 0),  -- Cent, bei Kilometer-Angaben km
  gueltig_von  date,
  gueltig_bis  date,
  erstellt_am  timestamptz not null default now(),
  check ((gueltig_von is null) = (gueltig_bis is null)),
  check (gueltig_bis is null or gueltig_bis >= gueltig_von)
);

-- Je Preis hoechstens ein dauerhafter Wert.
create unique index if not exists preise_dauerhaft on preise (schluessel) where gueltig_von is null;

-- Nur der Server (Secret Key) liest und schreibt.
alter table preise enable row level security;
