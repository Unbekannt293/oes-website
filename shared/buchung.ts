/**
 * Angaben zur Veranstaltung an der Kasse (Louis, 11.11.2026): Anlass,
 * Fotolayouts und Logo. Fuer Browser und Server gleich.
 */

/** Anlass der Veranstaltung. "sonstiges" mit eigenem Text. */
export const ANLAESSE = {
  'geburtstag': 'Geburtstag',
  'hochzeit': 'Hochzeit',
  'polterabend': 'Polterabend / JGA',
  'firmenfeier': 'Firmenfeier',
  'weihnachtsfeier': 'Weihnachtsfeier',
  'babyshower': 'Babyshower',
  'abschlussfeier': 'Abschlussfeier / Abiball',
  'jubilaeum': 'Jubiläum',
  'vereinsfeier': 'Vereinsfeier',
  'gartenparty': 'Gartenparty / Sommerfest',
  'sonstiges': 'Sonstiges',
} as const
export type Anlass = keyof typeof ANLAESSE
export const ANLASS_KEYS = Object.keys(ANLAESSE) as [Anlass, ...Anlass[]]

/**
 * Fotolayouts aus Louis' Uebersicht ("Beispiel Layouts"). Zwei Gruppen,
 * die sich nicht mischen lassen: Fotostreifen (der Drucker schneidet das
 * Blatt in zwei Streifen) oder ganze Fotos. Bilder in public/images/layouts.
 */
export const LAYOUTS = [
  { id: 'streifen-2', gruppe: 'streifen', name: 'Fotostreifen, 2 Bilder' },
  { id: 'streifen-3', gruppe: 'streifen', name: 'Fotostreifen, 3 Bilder' },
  { id: 'streifen-4', gruppe: 'streifen', name: 'Fotostreifen, 4 Bilder' },
  { id: 'foto-3-untereinander', gruppe: 'foto', name: '3 Bilder untereinander' },
  { id: 'foto-1-rand', gruppe: 'foto', name: '1 Bild mit Rand' },
  { id: 'foto-1-hoch', gruppe: 'foto', name: '1 Bild randlos, hoch' },
  { id: 'foto-1-textfeld', gruppe: 'foto', name: '1 Bild mit Textfeld' },
  { id: 'foto-4-raster', gruppe: 'foto', name: '4 Bilder im Raster' },
  { id: 'foto-1-quer', gruppe: 'foto', name: '1 Bild randlos, quer' },
  { id: 'foto-3-nebeneinander', gruppe: 'foto', name: '3 Bilder nebeneinander' },
] as const
export type LayoutId = typeof LAYOUTS[number]['id']
export type LayoutGruppe = typeof LAYOUTS[number]['gruppe']
export const LAYOUT_IDS = LAYOUTS.map(l => l.id) as [LayoutId, ...LayoutId[]]
export const LAYOUT_GRUPPEN: Record<LayoutGruppe, string> = { streifen: 'Fotostreifen', foto: 'Fotos' }
export const layoutBild = (id: LayoutId) => `/images/layouts/${id}.webp`
export const layoutName = (id: string) => LAYOUTS.find(l => l.id === id)?.name ?? id

/**
 * Regel: ein bis alle Layouts EINER Gruppe (1-3 Streifen oder 1-7 Fotos).
 * Gibt eine Fehlermeldung zurueck oder null, wenn die Auswahl passt.
 */
export function layoutFehler(auswahl: readonly string[]): string | null {
  if (!auswahl.length) return 'Bitte mindestens ein Layout wählen'
  const gruppen = new Set(auswahl.map(id => LAYOUTS.find(l => l.id === id)?.gruppe))
  if (gruppen.has(undefined)) return 'Unbekanntes Layout'
  if (gruppen.size > 1) return 'Fotostreifen und andere Layouts lassen sich nicht zusammen wählen'
  return null
}

/**
 * Logo fuer das Layout: Formate und Groesse (Browser und Server pruefen).
 * SVG und PDF (Vektor) gehen auch, Louis bekommt sie unveraendert.
 */
export const LOGO_TYPEN = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'] as const
export const LOGO_MAX_BYTES = 3 * 1024 * 1024
