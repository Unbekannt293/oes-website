# OES – Otto's Event Service

Website für Vermietung von Fotoboxen, Zelten sowie Ton- und Lichttechnik.

## Stack

- **Nuxt 4** (Vue 3, Vite) mit SSR – wichtig für lokales Google-Ranking
- **Eigene CSS-Tokens** statt UI-Framework, siehe `app/assets/css/tokens.css`
- **Reka UI** für barrierefreie Primitive (Dialog, Select, Tabs) – ungestylt
- **@nuxt/fonts** hostet die Schriften selbst, kein Request an Google (DSGVO)
- **Zod** für Validierung, dasselbe Schema im Browser und auf dem Server
- **Lenis** für Trägheitsscrollen, aus bei `prefers-reduced-motion`

Paketmanager: **npm**.

## Voraussetzung

Node **22+**. Achtung: auf diesem Rechner liegt ein zweites, älteres Node
aus miniforge im PATH und verdeckt das richtige. Einmalig in die `.zshrc`:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

Kontrolle: `node -v` muss `v22.x` zeigen, nicht `v20.19.5`.

## Loslegen

```bash
npm install
npm run dev
```

Wichtig: Die `package-lock.json` gehört ins Repo. Ohne sie scheitert
`npm install` mit npm 10 an einem Bug im Peer-Dependency-Resolver
(`Cannot read properties of null (reading 'edgesOut')`). Falls das je
passiert, hilft:

```bash
npx npm@11 install
```

Das Feld `allowScripts` in der `package.json` erlaubt esbuild, vue-demi
und fsevents ihre Postinstall-Skripte. Ohne diese Freigabe fehlt esbuild
sein Binary und der Dev-Server startet nicht.

## Struktur

```
app/
  assets/css/    tokens.css = Farben, Typo, Raum. Erst hier ändern, dann in Komponenten.
  components/    layout/ ui/ product/ – ohne Ordnerpräfix im Template nutzbar
  composables/   useReveal, useLenisScroll, useContact
  pages/         Dateibasiertes Routing
server/api/      Nitro-Endpunkte (Anfrage, später Verfügbarkeit & Distanz)
shared/          Typen, Katalog, Preislogik – wird von Client UND Server importiert
```

## Stand

Fertig: Design-System, Layout, Header/Footer, Startseite, Produktdaten,
Anfrage-Endpunkt mit Validierung.

Offen: Produktübersicht mit Filter, Produktdetail, Pakete, Über uns,
Kontaktformular, Warenkorb, Verfügbarkeitskalender, Bewertungen,
Impressum/Datenschutz/AGB/Widerruf, Mailversand, Distanz-API.
