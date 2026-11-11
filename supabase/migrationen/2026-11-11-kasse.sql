-- 11.11.2026: Neue Angaben an der Kasse (Louis).
--  kundenart/firma/ust_id: Privat- oder Firmenkunde, Firmenname auf der Rechnung
--  anlass/anlass_text:     was gefeiert wird ("sonstiges" mit eigenem Text)
--  layouts:                gewaehlte Fotolayouts (shared/buchung.ts)
--  logo_pfad:              Logo fuer das Layout im privaten Storage-Bucket "logos"
--  widerruf_zustimmung_am: Verbraucher hat zugestimmt, dass OES vor Ablauf der
--                          Widerrufsfrist beginnt (Nachweis, § 356 Abs. 4 BGB)
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

alter table buchungen add column if not exists kundenart text not null default 'privat';
alter table buchungen drop constraint if exists buchungen_kundenart_check;
alter table buchungen add constraint buchungen_kundenart_check check (kundenart in ('privat', 'firma'));
alter table buchungen add column if not exists firma text;
alter table buchungen add column if not exists ust_id text;
alter table buchungen add column if not exists anlass text;
alter table buchungen add column if not exists anlass_text text;
alter table buchungen add column if not exists layouts text[] not null default '{}';
alter table buchungen add column if not exists logo_pfad text;
alter table buchungen add column if not exists widerruf_zustimmung_am timestamptz;

-- Logos: nicht oeffentlich. Nur der Server (Secret Key) liest und schreibt,
-- Louis bekommt das Logo als Mailanhang und in der Verwaltung zum Download.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 3145728, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
