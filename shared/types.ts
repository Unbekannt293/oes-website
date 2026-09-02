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
  /** Tagespreis in Cent. Ganzzahlen, damit keine Rundungsfehler entstehen. */
  priceCents: number
  summary: string
  features: string[]
  images: string[]
  /** Für "bald verfügbar" quer ueber der Karte. */
  available: boolean
  /** Wieviele Exemplare existieren. Grundlage der Verfügbarkeitspruefung. */
  stock: number
}

export type PackageTier = 'basis' | 'klassik' | 'premium' | 'deluxe'

export interface RentalPackage {
  slug: string
  name: string
  /** 'fotobox' = die vier Tiers, 'event' = Komplettpakete */
  kind: 'fotobox' | 'event'
  tier?: PackageTier
  priceCents: number
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
  image?: string
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
