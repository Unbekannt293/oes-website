-- 05.11.2026: Fotos zu Bewertungen (bis zu 3 je Bewertung).
-- Die Bilder liegen in Supabase Storage im Bucket "bewertungen". Der Bucket
-- ist zum Lesen oeffentlich (die Seite zeigt die Bilder direkt), schreiben
-- und loeschen kann nur der Server mit dem Secret Key. Dateinamen sind
-- zufaellig, und die Adressen gibt der Server erst nach der Freischaltung
-- heraus.
-- Einmal im Supabase SQL-Editor ausfuehren. Kann gefahrlos mehrfach laufen.

alter table bewertungen add column if not exists bilder text[] not null default '{}';
alter table bewertungen drop constraint if exists bewertungen_bilder_check;
alter table bewertungen add constraint bewertungen_bilder_check
  check (coalesce(array_length(bilder, 1), 0) <= 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bewertungen', 'bewertungen', true, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
