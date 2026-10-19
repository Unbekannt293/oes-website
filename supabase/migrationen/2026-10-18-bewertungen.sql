-- 18.10.2026: Kundenbewertungen. Neue Bewertungen sind erst unsichtbar,
-- Louis schaltet sie per Link aus der Benachrichtigungsmail frei (oder hier
-- im Table Editor: freigegeben auf true setzen).
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

create table if not exists bewertungen (
  id             uuid primary key default gen_random_uuid(),
  erstellt_am    timestamptz not null default now(),
  name           text not null check (char_length(name) between 2 and 60),
  sterne         smallint not null check (sterne between 1 and 5),
  text           text not null check (char_length(text) between 10 and 1000),
  -- Worauf sich die Bewertung bezieht: Produkt oder Komplettpaket (Slug aus
  -- dem Katalog), null = allgemein (OES insgesamt).
  bezug          text,
  freigegeben    boolean not null default false,
  freigegeben_am timestamptz,
  -- Geheimer Schluessel fuer den Freigabe-Link in Louis' Mail.
  freigabe_token uuid not null default gen_random_uuid()
);

create index if not exists bewertungen_sichtbar on bewertungen (erstellt_am desc) where freigegeben;

-- Erlaubte Bezuege als eigene Regel, damit sie sich spaeter austauschen laesst.
alter table bewertungen drop constraint if exists bewertungen_bezug_check;
alter table bewertungen add constraint bewertungen_bezug_check
  check (bezug in ('fotobox', 'soundbox', 'kombi-fotobox-soundbox', 'kombi-fotobox-2-soundboxen'));

-- Nur der Server (Secret Key) liest und schreibt, wie bei den Buchungen.
alter table bewertungen enable row level security;
