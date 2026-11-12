# OES Website – Hinweise für Claude

- **Vor jeder Änderung an Oberfläche oder CSS: `STYLEGUIDE.md` lesen und befolgen.**
  Vorhandene Bausteine wiederverwenden (`app/components/ui/`, `forms.css`), keine
  zweite Variante bauen. Neue Bausteine und Regeln dort eintragen.
- Nuxt 4 / Vue 3. Komponenten ohne Ordner-Präfix (`pathPrefix: false`), z. B. `<UiHinweis>`.
- Texte deutsch, Kunden gesiezt. Code-Kommentare deutsch ohne Umlaute.
- Veröffentlicht wird nur mit `[deploy]` im Commit und nach Rücksprache mit Lukas.
  **Vorher immer lokal `npx nuxt build` laufen lassen** (der Dev-Server verzeiht
  CSS-Fehler, der Produktions-Build auf Netlify nicht). Danach höchstens ~4 Minuten
  auf die Live-Seite warten und Lukas in jedem Fall Bescheid geben.
- Ordner `qr/` nie committen, `.env` nie.
- Datenbankänderungen als Datei in `supabase/migrationen/` plus `supabase/schema.sql`;
  Lukas führt sie im Supabase SQL-Editor aus, danach mit echten `select`s prüfen.
