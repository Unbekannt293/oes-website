export type CategoryId = 'fotobox' | 'sound' | 'zelte' | 'mobiliar' | 'licht'

export interface Category {
  id: CategoryId
  label: string
}

export interface Product {
  slug: string
  name: string
  category: CategoryId
  /** Einstiegspreis in Cent. Ganzzahlen, damit keine Rundungsfehler entstehen. */
  priceCents: number
  /** Wofuer der Preis gilt, z. B. "pro Tag". Ohne Angabe: pro Veranstaltung. */
  priceUnit?: string
  summary: string
  features: string[]
  /** Leer, solange es kein echtes Foto gibt. */
  images: string[]
  /**
   * Welches Bild zu welcher Auswahl im Buchungskasten passt, als Index in
   * images. Schluessel: 'sb0' bis 'sb2' (Fotobox mit 0-2 Soundboxen),
   * 'anzahl1', 'anzahl2' (Soundbox-Anzahl). Die Galerie springt dorthin.
   */
  imageFor?: Record<string, number>
  /** false = "Coming soon" quer ueber der Karte. */
  available: boolean
  /** Wieviele Exemplare existieren. Grundlage der Verfügbarkeitspruefung. */
  stock: number
  /**
   * Wie gebucht wird: 'paket' = Paket und Veranstaltungstag waehlen (Fotobox),
   * 'zeitraum' = Anzahl und Mietzeitraum (Soundbox). Ohne Angabe: nicht buchbar.
   */
  booking?: 'paket' | 'zeitraum'
}

export type PackageTier = 'basic' | 'classic' | 'premium' | 'premium-plus' | 'deluxe'

/** Louis rechnet nach Wochentag der Veranstaltung: Montag bis Donnerstag oder Freitag bis Sonntag. */
export type Weekpart = 'moDo' | 'frSo'

/** Ein Fotobox-Paket aus Louis' Preisliste. */
export interface RentalPackage {
  slug: string
  /** Voller Name fuer Warenkorb und Rechnung, z. B. "Fotobox Premium". */
  name: string
  /** Kurzname fuer Listen, z. B. "Premium". */
  short: string
  tier: PackageTier
  /** Preis ohne Soundbox. */
  priceCents: number
  /** Anzahl Ausdrucke. 0 = nur digital, ohne Drucker. */
  prints: number
  /** Individuelles Fotodesign ist im Preis enthalten. */
  designIncluded?: boolean
  /**
   * Festpreise mit einer oder zwei Soundboxen, je nach Wochentag. Bewusst
   * einzeln gespeichert statt aus dem Rabatt gerechnet: so steht es in
   * Louis' Preisliste, auf ,99 gerundet.
   */
  withSoundbox?: Record<1 | 2, Record<Weekpart, number>>
  /** Lieferradius ohne Aufpreis, in Kilometern. */
  freeDeliveryKm: number
  highlight?: boolean
  available: boolean
}

export interface Addon {
  slug: string
  name: string
  priceCents: number
  /** false = noch nicht buchbar ("noch nicht verfügbar" laut Louis). */
  available: boolean
  image?: string
}

export interface SoundboxRates {
  perDayCents: Record<Weekpart, number>
  /** Pauschale Freitag bis Sonntag, drei Tage. */
  weekendCents: number
  /** Pauschale Montag bis Sonntag. */
  weekCents: number
  extraBatteryPerDayCents: number
}

export interface CartLine {
  /** Eindeutig je Zeile, zum Entfernen. */
  id: string
  /** Zeilen einer Buchung (Paket plus Zubehoer) teilen sich die Gruppe. */
  group: string
  kind: 'package' | 'product' | 'addon'
  slug: string
  name: string
  /** Zusatzinfo fuer die Anzeige, z. B. "mit 1 Soundbox". */
  detail?: string
  unitPriceCents: number
  quantity: number
  /** ISO-Datum, z. B. '2026-09-12' */
  from: string
  to: string
  freeDeliveryKm: number
  /** Was diese Zeile zur Kaution beitraegt. */
  deposit?: { fotobox: boolean, soundboxes: number }
}

export interface DeliveryQuote {
  distanceKm: number
  freeKm: number
  billableKm: number
  feeCents: number
}
