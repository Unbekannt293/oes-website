# OES Styleguide

Verbindlich für jede Änderung an der Website. Grundregel: **erst nachsehen, ob es
den Baustein schon gibt, dann wiederverwenden oder erweitern, nie daneben einen
zweiten bauen.** Wenn etwas zweimal gleich aussehen soll, ist es ein Baustein.

Stand: 11.11.2026. Bei neuen Bausteinen oder Regeln diese Datei mitpflegen.

---

## 1. Grundlagen

### Farben und Tokens (`app/assets/css/tokens.css`)
Nie Farbwerte direkt ins CSS schreiben, immer Tokens.

| Token | Wofür |
|---|---|
| `--c-gold` | Akzent: Buttons, Preise, Labels, Auswahlrand |
| `--c-gold-lift` | Hover auf Gold |
| `--c-gold-hair` | Haarlinien, Kartenrahmen, nicht gewählte Optionen |
| `--c-gold-tint` | zarte Goldfläche (Hinweise) |
| `--sel-flaeche`, `--sel-ring` | **gewählter Zustand** (siehe Auswahl) |
| `--c-danger`, `--c-danger-tint` | Fehler, fehlende Pflichtangabe (in `.on-ink` automatisch heller) |
| `--c-success`, `--c-success-tint` | Bestätigung („Im Warenkorb", „gesendet") |
| `--c-gold-glow` | Schein um Goldflächen |
| `--c-on-gold` | Schrift und Haken auf Gold |
| `--c-buehne` | dunkle Bühne (Hero, Bildhintergrund) |
| `--c-scrim` | abgedunkelter Hintergrund hinter Dialogen |
| `--c-control-line`, `--c-placeholder` | Rand von Feldern/Häkchen, Platzhaltertext |
| `--c-text`, `--c-text-muted` | Text, Nebentext |
| `--c-paper` / `--c-paper-pure` | Seitengrund / Karten (weiß) |
| `--c-ink` | Schwarz für Header, Footer, dunkle Flächen |

**Dunkle Flächen** bekommen die Klasse `.on-ink`, dann stimmen Text-, Linien- und
Kartenfarben automatisch. Keine eigenen `rgb(255 255 255 / x)`-Werte.

> Falle: `--border-hair` wird in `:root` ausgerechnet und passt sich in `.on-ink`
> **nicht** an. Bausteine, die auch auf Dunkel stehen, schreiben
> `1px solid var(--c-gold-hair)` aus.

### Schrift
- `.display` (Cormorant) für **jede** Überschrift: Seiten, Abschnitte, Dialoge, Erfolgsansichten.
  Dialog-Titel `--t-h2`, Unterteile `--t-h3`. Keine fetten Versal-Überschriften (außer `.label`).
- `.label` = gesperrte Versalien (Abschnittstitel klein, Kategorien, Links wie „ZUR FOTOBOX").
- Fließtext Inter, Nebentext `.muted`. Größen nur über die Skala:
  `--t-small` (0.875), `--t-xs` (0.8125, Kleingedrucktes, Fehler), `--t-2xs` (0.75), `--t-label` (0.6875).
- `.notiz` = Kleingedrucktes (klein, grau, mit Symbol davor automatisch in einer Zeile).
- `.etikett` = kleines Versal-Etikett neben einer Zeile („bald"), `.etikett--gruen` („inklusive"), `.etikett--gold`.

### Raum und Form
- Abstände nur über `--s-1` … `--s-10`.
- Ecken: `--r-sm` (Felder, Optionen, Buttons), `--r-md` (Karten, Dialoge). **Keine Pillen** (999px) für Etiketten oder Hinweise.
- Seitenbreite `.shell`, Abschnitte `.section`.

---

## 2. Bausteine – wiederverwenden

### Bedienelemente (`app/components/ui/`)
| Baustein | Einsatz |
|---|---|
| `UiButton` | Jeder Knopf. `solid` = Hauptaktion (gold gefüllt), `outline`/`light` = Nebenaktion, `ghost` nur im Paar mit einem `solid`. Größen `sm` (in Schritten), `lg`/`xl` (Kauf, Hero). |
| `UiField` | Jedes Formularfeld mit Label, „optional", Fehlermeldung. Eingaben haben die Klasse `.control`. |
| `UiIcon` | Jedes Symbol. Neue Symbole hier ergänzen (24er Raster, 1.6er Linie). Symbol der Marke ist `funke` (der Vierzack aus dem Logo): Schmuck, Trenner und **Bewertungen** (`ReviewStars`, auch anteilig gefüllt). Einen fünfzackigen Stern gibt es nicht mehr. |
| `UiHinweis` | **Der** Hinweis: Balken links, zarte Fläche, Symbol. `ton="info"` (gold), `"fehler"` (rot, Formular hat nicht geklappt), `"erfolg"` (grün, „Im Warenkorb"). Knopf/Link rechts über `<template #aktion>`. |
| `UiFehler` | Fehler zu **einem** Feld oder einer Auswahl, direkt darunter. `UiField :error` nutzt ihn selbst. |
| `UiErfolg` | Erfolgsansicht nach dem Absenden: Haken im Kreis, Titel, Text, Knöpfe (`#aktion`). Kasse, Bewertung, Kontakt, Zahlung. |
| `UiDialog` | **Der** Dialog: hell (weiß, Goldkante oben), `dunkel` (schwarz), `bild` (nur ein Bild groß). Schließen-Knopf immer als weißer Kreis auf der Ecke. Öffnen per Ref `.oeffnen()`, `@zu` beim Schließen, `:polster="false"` bei eigenem Raster. |
| `UiAufklapper` | Zum Aufklappen mit Linie oben und unten. Standard: kleiner Versal-Titel (Textfassung der Rechtstexte). `gross` + `untertitel`: Titel wie eine Abschnittsüberschrift, Linien oben und unten gold (Produktbeschreibung). |
| `UiFalle` + `useZeitfalle()` | Bot-Schutz für jedes öffentliche Formular (Honeypot und Zeitfalle). |
| `UiUpload` | **Der** Datei-Upload: Kacheln mit X, gestrichelte Kamera-Kachel. `lesen` macht das Einlesen (z. B. `fotoVerkleinern`, `logoLesen`), `schachbrett` für Logos. |
| `SectionHeading` | Abschnittsüberschrift mit Goldstrich. |

### Formulare (`app/assets/css/forms.css`)
- `.control` – Textfeld, Auswahlliste, Textbereich.
- `.check` – Häkchen (Zustimmungen, Zubehör).
- `.opts` / `.opt` – **Einzelauswahl als ganze Zeile** (Soundbox dazu, Zahlungsart, Übergabe, Kaution, Anzahl). Mit `opt__name`, `opt__sub`, `opt__price`, `opt__was`.
- `.segments` – kleine Auswahl nebeneinander.

### Seiten und Abläufe
| Baustein | Einsatz |
|---|---|
| `PageHero` | Kopf jeder Unterseite (Brotkrumen, Titel, Untertitel). `slim` für Warenkorb/Kasse. |
| `BookingStep` + `useSteps` | Jeder mehrschrittige Ablauf (Buchungskästen, Kasse): Akkordeon mit Nummer, Zusammenfassung, Haken. |
| `ProductCard` | Jede Produkt- oder Paketkarte. |
| `ProductGallery` | Jede Bildergalerie mit Pfeilen und Vorschaubildern. |
| `PackageCompare` | Vergleich der Fotobox-Stufen. |
| `DateCalendar` | Datumswahl. |
| `LayoutWahl` / `LayoutDialog` | Fotolayouts (im Buchungskasten und als Nachholen an der Kasse). |
| `Review*` | Alles zu Bewertungen (Sterne, Karte, Formular, Dialog). |
| `PdfLeser` | Rechtstexte (AGB, Datenschutz, Widerruf): PDF-Ansicht, Inhaltsverzeichnis, Download. |

---

## 3. Zustände

### Auswahl (gewählt)
**Überall gleich:** Goldrand + `var(--sel-flaeche)` + `var(--sel-ring)`.
Gilt für `.opt.is-sel`, die gewählte Spalte im `PackageCompare`, `.segments`.
Nicht gewählt: weiß mit `--c-gold-hair`-Rand, Hover: Goldrand.
Klasse für den Zustand immer `is-sel`. Ausnahme mit Absicht: Layout-Bilder auf
dunklem Grund leuchten gold auf (`LayoutWahl`), Kalendertage sind gold gefüllt.

### Fehler
Pflichtfeld fehlt: `UiField :error`, Rahmen `--c-danger`, Kasten mit
`--c-danger-tint` (z. B. Mietvertrag nicht bestätigt). Hinweis mit Aufgabe: `UiHinweis ton="fehler"`.

### Hinweise und Erfolg
Nur `UiHinweis` (kurz, im Fluss) bzw. `UiErfolg` (ersetzt ein Formular nach dem Absenden).
Keine eigenen Balken, Kästen oder Banner bauen.

---

## 4. Muster

- **Dialoge**: immer `UiDialog`, nie ein eigenes `<dialog>`.
- **Mehr Text auf einer Seite**: hinter `UiAufklapper`, nicht als lange offene Sektion.
- **Preise**: `formatPrice()`, gold für Endpreise, Einzelpreis zum Vergleich als `<s class="opt__was">`.
- **Ersparnis/Rabatt**: nur als Wort „günstiger" (`UiHinweis`), keine Prozent-
  oder Euro-Werbung, keine Bänder, keine Sterne.
- **Bilder**: Produktfotos nie hochrechnen. Nutzer-Uploads im Browser verkleinern.
- **Leere/kommende Produkte**: „Coming soon" bzw. Zubehör mit „bald", nur Name, keine geratenen Angaben.

## 5. Sprache und Ton
- Kunden werden **gesiezt** (auch Texte von Louis angleichen).
- Kurze, klare Sätze. Knöpfe sagen, was passiert („Zahlungspflichtig bestellen", „Layout wählen").
- Code-Kommentare deutsch ohne Umlaute, mit Datum und Wer es wollte, wenn es eine Entscheidung ist.

## 6. Was Lukas nicht will
- Pillen-Etiketten, Sterne als Schmuck, Emoji
- Icon-Kachel-Raster („wirkt KI-haft"), Infobalken mit fettem Vorspann („Zusammen günstiger: …")
- große Rabatt-Bänder auf Bildern
- zwei Varianten derselben Sache (Upload, Auswahl, Hinweis)

## 7. Altlasten

Prüfung und Aufräumen am 11.11.2026. Erledigt:

| Was | vorher | jetzt |
|---|---|---|
| Dialoge | 5 eigene, 4 Schließen-Knöpfe | alle `UiDialog`, ein Schließen-Knopf |
| Fehlermeldungen | 17 Klassen | `UiFehler` (Feld) und `UiHinweis ton="fehler"` (Formular), auch in der Verwaltung |
| Erfolgsfenster | 4 eigene + „Im Warenkorb" + „gesendet" | `UiErfolg` und `UiHinweis ton="erfolg"` |
| „bald"/„inklusive" | 7 Varianten | `.etikett` (Produktkarte und Produktseite haben bewusst eigene „Coming soon"-Blöcke) |
| Kleingedrucktes | ~20 Klassen | `.notiz` |
| Bot-Schutz | 2× kopiert | `UiFalle` + `useZeitfalle()` |
| Schriftgrößen | 66 freie Werte | 37 auf Tokens, 29 Sonderfälle übrig (Überschriften der Bewertungen, Zahlen) |
| Farben | 124 feste Werte | 84 übrig, fast nur `#FFFFFF` und Lichteffekte im `PageHero` |
| Firmen-Häkchen | eigene Checkbox | `.check` |
| Textfassung Rechtstexte | eigenes `<details>` | `UiAufklapper` |

Offen (bewusst später, niedrige Priorität):
- Verwaltung: Seiten mit eigenen Layout-Stilen (nur Louis sieht sie).
- Restliche feste Farben in `PageHero` (Lichteffekte) und `#FFFFFF`.
- Überschriften im Bewertungsdialog (`rd__h`) nutzen eigene Größen statt `.display`/`.label`.
