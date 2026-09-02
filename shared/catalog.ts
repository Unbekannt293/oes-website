import type { Addon, Category, Product, RentalPackage } from './types'

/**
 * Vorlaeufiger Katalog, direkt aus den Mockups uebernommen.
 * Preise und Bestand spaeter aus einem CMS oder einer DB ziehen,
 * damit Louis sie ohne Deploy aendern kann.
 */

export const categories: Category[] = [
  { id: 'zelte',          label: 'Zelte',          blurb: 'Verschiedene Zeltgrößen für jeden Anlass.' },
  { id: 'fotoautomaten',  label: 'Fotoautomaten',  blurb: 'Moderne Fotoboxen für lustige Erinnerungen.' },
  { id: 'ton-musik',      label: 'Ton & Musik',    blurb: 'Soundanlagen, Lautsprecher & Mischpulte.' },
  { id: 'lichttechnik',   label: 'Lichttechnik',   blurb: 'Stimmungsvolle Beleuchtung für jedes Event.' },
  { id: 'posten-theken',  label: 'Posten & Theken', blurb: 'Theken und Stehtische für Ihre Gäste.' },
  { id: 'zubehoer',       label: 'Zubehör',       blurb: 'Passendes Zubehör für Ihr Event.' },
]

export const products: Product[] = [
  {
    slug: 'pagodenzelt-10x6', name: 'Pagodenzelt 10x6m', category: 'zelte',
    priceCents: 19900, summary: 'Großzügiges Pagodenzelt für bis zu 60 Gäste.',
    features: ['10 x 6 Meter Grundfläche', 'Seitenwaende abnehmbar', 'Auf- & Abbau inklusive'],
    images: ['/images/platzhalter.svg'], available: true, stock: 1,
  },
  {
    slug: 'festzelt-6x12', name: 'Festzelt 6x12m', category: 'zelte',
    priceCents: 24900, summary: 'Klassisches Festzelt für größere Feiern.',
    features: ['6 x 12 Meter Grundfläche', 'Wetterfeste Plane', 'Auf- & Abbau inklusive'],
    images: ['/images/platzhalter.svg'], available: true, stock: 1,
  },
  {
    slug: 'faltzelt-3x3', name: 'Faltzelt 3x3m', category: 'zelte',
    priceCents: 5900, summary: 'Schnell aufgebaut, ideal als Bar- oder Buffetdach.',
    features: ['3 x 3 Meter', 'In Minuten aufgebaut', 'Auch als Zusatz zum Paket'],
    images: ['/images/platzhalter.svg'], available: true, stock: 4,
  },
  {
    slug: 'fotobox-classic', name: 'Fotobox Classic', category: 'fotoautomaten',
    priceCents: 29900, summary: 'Die bewährte Fotobox mit Touchscreen und Sofortdruck.',
    features: ['Hochwertige Kamera & Studioblitz', 'Touchscreen & einfache Bedienung', 'Digitale Bilder per E-Mail'],
    images: ['/images/platzhalter.svg'], available: true, stock: 2,
  },
  {
    slug: 'fotobox-premium', name: 'Fotobox Premium', category: 'fotoautomaten',
    priceCents: 39900, summary: 'Fotobox im schwarzen Gehaeuse mit individuellem Layout.',
    features: ['Sofortdruck in Top-Qualität', 'Individuelles Layout & Branding', 'Online-Galerie inklusive'],
    images: ['/images/platzhalter.svg'], available: true, stock: 1,
  },
  {
    slug: '360-video-booth', name: '360° Video Booth', category: 'fotoautomaten',
    priceCents: 49900, summary: 'Rotierende Plattform für Videos, die geteilt werden.',
    features: ['Slow-Motion-Videos', 'Bis zu 3 Personen gleichzeitig', 'Sofortiger Download per QR-Code'],
    images: ['/images/platzhalter.svg'], available: false, stock: 0,
  },
  {
    slug: 'musikbox', name: 'Musikbox', category: 'ton-musik',
    priceCents: 14900, summary: 'Kompakte Box für Hintergrundmusik und kleine Feiern.',
    features: ['Bluetooth & Klinke', 'Akkubetrieb möglich', 'Inklusive Ständer'],
    images: ['/images/platzhalter.svg'], available: true, stock: 2,
  },
  {
    slug: 'mischpult', name: 'Mischpult', category: 'ton-musik',
    priceCents: 4900, summary: 'Professionelles Mischpult für perfekten Sound.',
    features: ['Mehrere Kanäle', 'Für DJ- und Live-Betrieb', 'Kabel inklusive'],
    images: ['/images/platzhalter.svg'], available: false, stock: 0,
  },
  {
    slug: 'aktivlautsprecher', name: 'Aktivlautsprecher', category: 'ton-musik',
    priceCents: 9900, summary: 'Kraftvoller Aktivlautsprecher für größere Räume.',
    features: ['Integrierte Endstufe', 'Auf Stativ oder am Boden', 'Kabel inklusive'],
    images: ['/images/platzhalter.svg'], available: true, stock: 2,
  },
  {
    slug: 'lichtset-basic', name: 'Lichtset Basic', category: 'lichttechnik',
    priceCents: 4900, summary: 'Einstieg in stimmungsvolles Eventlicht.',
    features: ['Zwei LED-Spots', 'Musikgesteuert', 'Ständer inklusive'],
    images: ['/images/platzhalter.svg'], available: true, stock: 3,
  },
  {
    slug: 'lichtset-premium', name: 'Lichtset Premium', category: 'lichttechnik',
    priceCents: 8900, summary: 'Mehr Spots, mehr Farben, mehr Bühne.',
    features: ['Vier LED-Spots', 'DMX-steuerbar', 'Auf- & Abbau inklusive'],
    images: ['/images/platzhalter.svg'], available: true, stock: 1,
  },
  {
    slug: 'stimmungsbeleuchtung', name: 'Stimmungsbeleuchtung', category: 'lichttechnik',
    priceCents: 5900, summary: 'Warmes Ambientelicht für Zelt und Raum.',
    features: ['Lichterketten & Uplights', 'Warmweiss oder farbig', 'Individuell platziert'],
    images: ['/images/platzhalter.svg'], available: true, stock: 2,
  },
]

export const fotoboxPackages: RentalPackage[] = [
  {
    slug: 'fotobox-basis', name: 'Basis Paket', kind: 'fotobox', tier: 'basis',
    priceCents: 29900, freeDeliveryKm: 4,
    includes: ['Fotobox', 'Ohne Drucker', 'Requisiten inklusive', 'Kostenlose Lieferung bis 4 km'],
    image: '/images/platzhalter.svg',
  },
  {
    slug: 'fotobox-klassik', name: 'Klassik Paket', kind: 'fotobox', tier: 'klassik',
    priceCents: 49900, freeDeliveryKm: 4,
    includes: ['Fotobox', 'Drucker + 150 Blatt', 'Requisiten inklusive', 'Kostenlose Lieferung bis 4 km'],
    image: '/images/platzhalter.svg',
  },
  {
    slug: 'fotobox-premium-paket', name: 'Premium Paket', kind: 'fotobox', tier: 'premium',
    priceCents: 69900, freeDeliveryKm: 6, highlight: true,
    includes: ['Fotobox', 'Drucker + 400 Blatt', 'Requisiten inklusive', 'Kostenlose Lieferung bis 6 km'],
    image: '/images/platzhalter.svg',
  },
  {
    slug: 'fotobox-deluxe', name: 'Deluxe Paket', kind: 'fotobox', tier: 'deluxe',
    priceCents: 89900, freeDeliveryKm: 8,
    includes: ['Fotobox', 'Drucker + 700 Blatt', 'Requisiten inklusive', 'Kostenlose Lieferung bis 8 km'],
    image: '/images/platzhalter.svg',
  },
]

export const eventPackages: RentalPackage[] = [
  {
    slug: 'party-starter', name: 'Party Starter', kind: 'event',
    priceCents: 69900, freeDeliveryKm: 4,
    includes: ['Soundbox', 'Lautsprecherständer', 'Faltzelt 3 x 3 m'],
    image: '/images/platzhalter.svg',
  },
  {
    slug: 'event-premium', name: 'Event Premium', kind: 'event',
    priceCents: 100000, freeDeliveryKm: 6, highlight: true,
    includes: ['Soundbox + Ständer', 'Faltzelt 3 x 3 m', 'Fotobox Premium', 'Auf- & Abbau inklusive'],
    image: '/images/platzhalter.svg',
  },
  {
    slug: 'rundum-sorglos', name: 'Rundum-Sorglos', kind: 'event',
    priceCents: 149900, freeDeliveryKm: 8,
    includes: ['Soundanlage', 'Pagodenzelt', 'Fotobox Premium', 'Lichtset Premium', 'Auf- & Abbau inklusive'],
    image: '/images/platzhalter.svg',
  },
]

export const addons: Addon[] = [
  { slug: 'premium-requisiten', name: 'Premium Requisiten', priceCents: 3900 },
  { slug: 'hintergrundsystem', name: 'Hintergrundsystem', priceCents: 4900 },
  { slug: 'persönliches-layout', name: 'Persönliches Layout', priceCents: 2900 },
  { slug: 'gaestebuch', name: 'Gästebuch inkl. Stift & Kleber', priceCents: 3500 },
  { slug: 'usb-stick', name: 'USB-Stick mit allen Bildern', priceCents: 1900 },
  { slug: 'roter-teppich', name: 'Roter Teppich & Absperrständer', priceCents: 9900 },
]

export const allPackages = [...eventPackages, ...fotoboxPackages]

export function findProduct(slug: string) {
  return products.find(p => p.slug === slug)
}
export function findPackage(slug: string) {
  return allPackages.find(p => p.slug === slug)
}
