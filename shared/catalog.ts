import type { Addon, Category, Product, RentalPackage, SoundboxRates } from './types'

/**
 * Katalog von OES. Preise aus Louis' Preisliste (Stand 12.10.2026).
 * Preise und Bestand spaeter aus der Datenbank ziehen, damit Louis sie
 * ohne Deploy aendern kann.
 *
 * Vorhanden: eine Fotobox mit Drucker und zwei Soundboxen samt Stativen.
 * Geplant und auf der Seite als "Coming soon": Zelt, Bierzelt, Garnitur,
 * Lichter. Dazu stehen bewusst nur Name und Kategorie hier, keine
 * Beschreibung, Preise oder Masse: die kennen wir noch nicht.
 */

export const categories: Category[] = [
  { id: 'fotobox',  label: 'Fotobox' },
  { id: 'sound',    label: 'Sound' },
  { id: 'zelte',    label: 'Zelte' },
  { id: 'mobiliar', label: 'Mobiliar' },
  { id: 'licht',    label: 'Licht' },
]

/** Geplante Produkte ohne Angaben. */
function comingSoon(slug: string, name: string, category: Category['id']): Product {
  return { slug, name, category, priceCents: 0, summary: '', features: [], images: [], available: false, stock: 0 }
}

export const products: Product[] = [
  {
    slug: 'fotobox', name: 'Fotobox', category: 'fotobox',
    priceCents: 14900, summary: 'Unsere Fotobox mit Touchscreen, LED-Licht und Sofortdruck.',
    features: ['Hochwertige Kamera & LED-Licht', 'Touchscreen & einfache Bedienung', 'Sofortdruck je nach Paket', 'Digitale Bilder in der Online-Galerie'],
    images: [
      '/images/produkte/fotobox-oes.webp',
      '/images/produkte/fotobox-front.webp',
      '/images/produkte/fotobox-mit-drucker.webp',
      '/images/produkte/drucker-dnp.webp',
      '/images/produkte/set-fotobox-soundbox-drucker.webp',
      '/images/produkte/set-fotobox-zwei-soundboxen-drucker.webp',
    ],
    // Galerie springt mit der Soundbox-Wahl im Buchungskasten mit.
    imageFor: { sb0: 0, sb1: 4, sb2: 5 },
    available: true, stock: 1,
    booking: 'paket',
  },
  {
    slug: 'soundbox', name: 'Soundbox', category: 'sound',
    priceCents: 2500, priceUnit: 'pro Tag', summary: 'Akkubetriebene Partybox mit kräftigem Sound, drinnen wie draußen.',
    features: ['Bluetooth & Klinke', 'Akkubetrieb, kein Stromanschluss nötig', 'Stativ mit weißer Husse inklusive'],
    images: [
      '/images/produkte/soundbox-front.webp',
      '/images/produkte/soundbox-schraeg.webp',
      '/images/produkte/soundbox-seite.webp',
      '/images/produkte/soundbox-anschluesse.webp',
      '/images/produkte/soundbox-rueckseite.webp',
      '/images/produkte/soundbox-staender-1.webp',
      '/images/produkte/soundbox-staender-2.webp',
      '/images/produkte/soundbox-staender-3.webp',
      '/images/produkte/soundbox-staender-4.webp',
      '/images/produkte/soundbox-doppel-1.webp',
      '/images/produkte/soundbox-doppel-2.webp',
      '/images/produkte/soundbox-doppel-3.webp',
    ],
    // Bei zwei Soundboxen zeigt die Galerie das Doppel-Foto.
    imageFor: { anzahl1: 0, anzahl2: 9 },
    available: true, stock: 2,
    booking: 'zeitraum',
  },
  comingSoon('zelt', 'Zelt', 'zelte'),
  comingSoon('bierzelt', 'Bierzelt', 'zelte'),
  comingSoon('garnitur', 'Bierzeltgarnitur', 'mobiliar'),
  comingSoon('lichter', 'Lichter', 'licht'),
]

/*
 * Fotobox-Pakete aus Louis' Preisliste (12.10.2026), Preise pro
 * Veranstaltungstag. Kombi mit Soundbox: ca. 5 % Rabatt, als Festpreise je
 * Mo-Do / Fr-So (der Miettag, nicht mehrere Tage). Zubehoer und Lieferung
 * sind nicht rabattiert.
 */
export const fotoboxPackages: RentalPackage[] = [
  {
    slug: 'fotobox-basic', name: 'Fotobox Basic', short: 'Basic', tier: 'basic',
    priceCents: 14900, prints: 0, freeDeliveryKm: 4, available: true,
    withSoundbox: { 1: { moDo: 16499, frSo: 16999 }, 2: { moDo: 18899, frSo: 19899 } },
  },
  {
    slug: 'fotobox-classic', name: 'Fotobox Classic', short: 'Classic', tier: 'classic',
    priceCents: 22999, prints: 150, freeDeliveryKm: 4, available: true,
    withSoundbox: { 1: { moDo: 24199, frSo: 24699 }, 2: { moDo: 26599, frSo: 27599 } },
  },
  {
    slug: 'fotobox-premium', name: 'Fotobox Premium', short: 'Premium', tier: 'premium',
    priceCents: 27999, prints: 300, designIncluded: true, freeDeliveryKm: 8, highlight: true, available: true,
    withSoundbox: { 1: { moDo: 28999, frSo: 29499 }, 2: { moDo: 31399, frSo: 32299 } },
  },
  {
    slug: 'fotobox-premium-plus', name: 'Fotobox Premium Plus', short: 'Premium Plus', tier: 'premium-plus',
    priceCents: 31999, prints: 500, designIncluded: true, freeDeliveryKm: 8, available: true,
    withSoundbox: { 1: { moDo: 32799, frSo: 33299 }, 2: { moDo: 35199, frSo: 36099 } },
  },
  {
    slug: 'fotobox-deluxe', name: 'Fotobox Deluxe', short: 'Deluxe', tier: 'deluxe',
    priceCents: 34999, prints: 700, designIncluded: true, freeDeliveryKm: 8, available: true,
    withSoundbox: { 1: { moDo: 35599, frSo: 36099 }, 2: { moDo: 37999, frSo: 38999 } },
  },
]

/**
 * Pakete-Seite: die Kombis aus Fotobox und Soundboxen, im Format der
 * Produkte, damit sie dieselbe Karte nutzen. Die Druckstufe (Basic bis
 * Deluxe) waehlt man erst im Buchungskasten. Preis = guenstigste Stufe
 * an einem Tag Mo-Do.
 */
export type Kombi = Product & { soundboxes: 0 | 1 | 2, to: string }

const kombiFrom = (n: 1 | 2) => Math.min(...fotoboxPackages.map(p => p.withSoundbox![n].moDo))

export const kombis: Kombi[] = [
  {
    slug: 'kombi-fotobox', name: 'Fotobox', category: 'fotobox', soundboxes: 0,
    to: '/produkte/fotobox#buchen',
    priceCents: Math.min(...fotoboxPackages.map(p => p.priceCents)),
    summary: 'Mit Sofortdruck oder rein digital.',
    features: [], images: ['/images/produkte/fotobox-oes.webp', '/images/produkte/fotobox-mit-drucker.webp'],
    available: true, stock: 1,
  },
  {
    slug: 'kombi-fotobox-soundbox', name: 'Fotobox + Soundbox', category: 'fotobox', soundboxes: 1,
    to: '/produkte/fotobox?sb=1#buchen',
    priceCents: kombiFrom(1),
    summary: 'Fotos und Musik aus einer Hand, günstiger als einzeln.',
    features: [], images: ['/images/produkte/set-fotobox-soundbox-drucker.webp'],
    available: true, stock: 1,
  },
  {
    slug: 'kombi-fotobox-2-soundboxen', name: 'Fotobox + 2 Soundboxen', category: 'fotobox', soundboxes: 2,
    to: '/produkte/fotobox?sb=2#buchen',
    priceCents: kombiFrom(2),
    summary: 'Zwei Soundboxen für größere Feiern.',
    features: [], images: [
      '/images/produkte/set-fotobox-zwei-soundboxen-drucker.webp',
      '/images/produkte/set-fotobox-zwei-soundboxen-drucker-oben.webp',
    ],
    available: true, stock: 1,
  },
]

/** Soundboks einzeln, aus Louis' Preisliste (12.10.2026). Preise pro Box. */
export const soundboxRates: SoundboxRates = {
  perDayCents: { moDo: 2500, frSo: 3000 },
  weekendCents: 6500,
  weekCents: 14500,
  extraBatteryPerDayCents: 500,
}

/**
 * Fotobox-Zubehoer aus Louis' Preisliste. Das eigene Foto-Layout ist bei
 * Premium, Premium Plus und Deluxe inklusive (designIncluded).
 */
export const LAYOUT_ADDON = 'eigenes-layout'
export const addons: Addon[] = [
  { slug: LAYOUT_ADDON, name: 'Eigenes Foto-Layout / Branding', priceCents: 1499, available: true },
  { slug: 'premium-requisiten', name: 'Premium-Requisiten', priceCents: 999, available: false },
  { slug: 'hintergrund', name: 'Hintergrund / Leinwand', priceCents: 2999, available: false },
  { slug: 'gaestebuch', name: 'Gästebuch', priceCents: 1999, available: false },
]

export function findProduct(slug: string) {
  return products.find(p => p.slug === slug)
}
export function findPackage(slug: string) {
  return fotoboxPackages.find(p => p.slug === slug)
}
