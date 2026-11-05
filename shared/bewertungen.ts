/**
 * Bewertungen: worauf sie sich beziehen koennen und wie sie im Browser
 * ankommen. Freigegeben sind hier immer alle, unfreigegebene verlaesst
 * der Server nie.
 *
 * Jedes Komplettpaket hat eigene Bewertungen (Lukas, 18.10.2026). Die
 * Schluessel sind die Slugs aus dem Katalog (kombis), die Fotobox allein
 * ist einfach "fotobox".
 */
export const BEZUEGE = {
  'fotobox': 'Fotobox',
  'soundbox': 'Soundbox',
  'kombi-fotobox-soundbox': 'Fotobox + Soundbox',
  'kombi-fotobox-2-soundboxen': 'Fotobox + 2 Soundboxen',
} as const

export type Bezug = keyof typeof BEZUEGE
export const BEZUG_KEYS = Object.keys(BEZUEGE) as [Bezug, ...Bezug[]]

/** Fotobox-Seite: welche Bewertungen zur gewaehlten Soundbox-Zahl gehoeren. */
export const BEZUG_NACH_SOUNDBOXEN: Record<0 | 1 | 2, Bezug> = {
  0: 'fotobox',
  1: 'kombi-fotobox-soundbox',
  2: 'kombi-fotobox-2-soundboxen',
}

/**
 * Filter auf der Startseite und im Popup: grobe Themen statt einzelner
 * Produkte. "pakete" fasst alle Komplettpakete zusammen.
 */
export const THEMEN = {
  allgemein: 'OES allgemein',
  fotobox: 'Fotobox',
  soundbox: 'Soundbox',
  pakete: 'Komplettpakete',
} as const

export type Thema = keyof typeof THEMEN

export function themaVon(bezug: Bezug | null): Thema {
  if (!bezug) return 'allgemein'
  return bezug.startsWith('kombi-') ? 'pakete' : bezug as Thema
}

export interface Bewertung {
  id: string
  name: string
  sterne: number
  text: string
  /** null = allgemein, OES insgesamt. */
  bezug: Bezug | null
  /** Volle Bild-Adressen (vom Server gebaut), hoechstens BILDER_MAX. */
  bilder?: string[]
  erstellt_am: string
}

/** Schnitt auf eine Nachkommastelle, wie man es von Shops kennt (4,7). */
export function zusammenfassung(liste: Bewertung[]) {
  const anzahl = liste.length
  const schnitt = anzahl ? Math.round((liste.reduce((s, b) => s + b.sterne, 0) / anzahl) * 10) / 10 : 0
  return { anzahl, schnitt }
}

export const formatSchnitt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Welche Bewertungen die Karte unter einem Produkt zeigt (hoechstens n):
 * die neuesten (Lukas, 19.10.2026). Ehrlicher als "beste zuerst" und zeigt,
 * dass gerade gebucht wird. liste kommt vom Server schon neueste zuerst.
 */
export function vorschau(liste: Bewertung[], n: number): Bewertung[] {
  return liste.slice(0, n)
}

/** Fotos je Bewertung und ihre Groesse (Browser verkleinert, Server prueft). */
export const BILDER_MAX = 3
export const BILD_KANTE = 1600
export const BILD_MAX_BYTES = 1_048_576
