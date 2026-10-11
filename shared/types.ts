export type CategoryId =
  | 'zelte' | 'fotoautomaten' | 'ton-musik'
  | 'lichttechnik' | 'posten-theken' | 'zubehoer'

export interface Category {
  id: CategoryId
  label: string
  blurb: string
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
  /** false = "Coming soon" quer ueber der Karte. */
  available: boolean
  /** Wieviele Exemplare existieren. Grundlage der Verfügbarkeitspruefung. */
  stock: number
}

export type PackageTier = 'fotobox' | 'basic' | 'premium' | 'deluxe'

/** Louis rechnet nach Wochentag der Veranstaltung: Montag bis Donnerstag oder Freitag bis Sonntag. */
export type Weekpart = 'moDo' | 'frSo'

export interface RentalPackage {
  slug: string
  name: string
  /** 'fotobox' = die vier Tiers, 'event' = Komplettpakete */
  kind: 'fotobox' | 'event'
  tier?: PackageTier
  /** Preis ohne Soundbox. */
  priceCents: number
  /**
   * Festpreise mit einer oder zwei Soundboxen, je nach Wochentag. Bewusst
   * einzeln gespeichert statt aus dem Rabatt gerechnet: Louis' Preise folgen
   * keiner einheitlichen Formel.
   */
  withSoundbox?: Record<1 | 2, Record<Weekpart, number>>
  includes: string[]
  /** Lieferradius ohne Aufpreis, in Kilometern. */
  freeDeliveryKm: number
  highlight?: boolean
  image: string
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
  kind: 'package' | 'product' | 'addon'
  slug: string
  name: string
  unitPriceCents: number
  quantity: number
  /** ISO-Datum, z. B. '2026-09-12' */
  from: string
  to: string
  freeDeliveryKm: number
}

export interface DeliveryQuote {
  distanceKm: number
  freeKm: number
  billableKm: number
  feeCents: number
}
