import type { Addon, Category, Product, RentalPackage, SoundboxRates } from './types'

/**
 * Vorlaeufiger Katalog, direkt aus den Mockups uebernommen.
 * Preise und Bestand spaeter aus einem CMS oder einer DB ziehen,
 * damit Louis sie ohne Deploy aendern kann.
 *
 * Stand Inventar (Produktfotos vom 07.10.2026): eine Fotobox und zwei
 * Soundboxen samt Stativen, dazu ein Fotodrucker. Alles andere steht im
 * Mockup, ist also geplant, aber noch nicht da: available false, die
 * Karte zeigt dann "Coming soon" (Louis: "Da noch nicht viel Inventar
 * vorhanden ..."). Ohne Foto bleibt images leer, die Karte zeichnet
 * dann eine eigene Kachel statt eines Platzhalterbilds.
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
    images: [], available: false, stock: 0,
  },
  {
    slug: 'festzelt-6x12', name: 'Festzelt 6x12m', category: 'zelte',
    priceCents: 24900, summary: 'Klassisches Festzelt für größere Feiern.',
    features: ['6 x 12 Meter Grundfläche', 'Wetterfeste Plane', 'Auf- & Abbau inklusive'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'faltzelt-3x3', name: 'Faltzelt 3x3m', category: 'zelte',
    priceCents: 5900, summary: 'Schnell aufgebaut, ideal als Bar- oder Buffetdach.',
    features: ['3 x 3 Meter', 'In Minuten aufgebaut', 'Auch als Zusatz zum Paket'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'fotobox', name: 'Fotobox', category: 'fotoautomaten',
    priceCents: 12999, summary: 'Unsere Fotobox mit Touchscreen, LED-Licht und Sofortdruck.',
    features: ['Hochwertige Kamera & LED-Licht', 'Touchscreen & einfache Bedienung', 'Sofortdruck je nach Paket', 'Digitale Bilder per E-Mail'],
    images: ['/images/produkte/fotobox-nah.webp', '/images/produkte/fotobox-drucker.webp'], available: true, stock: 1,
    booking: 'paket',
  },
  {
    slug: '360-video-booth', name: '360° Video Booth', category: 'fotoautomaten',
    priceCents: 49900, summary: 'Rotierende Plattform für Videos, die geteilt werden.',
    features: ['Slow-Motion-Videos', 'Bis zu 3 Personen gleichzeitig', 'Sofortiger Download per QR-Code'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'soundbox', name: 'Soundbox', category: 'ton-musik',
    priceCents: 2500, priceUnit: 'pro Tag', summary: 'Akkubetriebene Partybox mit kräftigem Sound, drinnen wie draußen.',
    features: ['Bluetooth & Klinke', 'Akkubetrieb, kein Stromanschluss nötig', 'Stativ mit weißer Husse inklusive'],
    images: ['/images/produkte/soundbox-nah.webp', '/images/produkte/soundbox-stativ.webp', '/images/produkte/soundbox-nah-seite.webp', '/images/produkte/soundbox-stativ-seite.webp'],
    available: true, stock: 2,
    booking: 'zeitraum',
  },
  {
    slug: 'mischpult', name: 'Mischpult', category: 'ton-musik',
    priceCents: 4900, summary: 'Professionelles Mischpult für perfekten Sound.',
    features: ['Mehrere Kanäle', 'Für DJ- und Live-Betrieb', 'Kabel inklusive'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'aktivlautsprecher', name: 'Aktivlautsprecher', category: 'ton-musik',
    priceCents: 9900, summary: 'Kraftvoller Aktivlautsprecher für größere Räume.',
    features: ['Integrierte Endstufe', 'Auf Stativ oder am Boden', 'Kabel inklusive'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'lichtset-basic', name: 'Lichtset Basic', category: 'lichttechnik',
    priceCents: 4900, summary: 'Einstieg in stimmungsvolles Eventlicht.',
    features: ['Zwei LED-Spots', 'Musikgesteuert', 'Ständer inklusive'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'lichtset-premium', name: 'Lichtset Premium', category: 'lichttechnik',
    priceCents: 8900, summary: 'Mehr Spots, mehr Farben, mehr Bühne.',
    features: ['Vier LED-Spots', 'DMX-steuerbar', 'Auf- & Abbau inklusive'],
    images: [], available: false, stock: 0,
  },
  {
    slug: 'stimmungsbeleuchtung', name: 'Stimmungsbeleuchtung', category: 'lichttechnik',
    priceCents: 5900, summary: 'Warmes Ambientelicht für Zelt und Raum.',
    features: ['Lichterketten & Uplights', 'Warmweiss oder farbig', 'Individuell platziert'],
    images: [], available: false, stock: 0,
  },
]

/*
 * Fotobox-Preise von Louis (Oktober 2026). Mit Soundbox gibt es Festpreise je
 * Wochentag der Veranstaltung. Louis nennt dazu "15 % Rabatt" (1 Soundbox) und
 * "25 % Rabatt" (2 Soundboxen) als Werbeaussage, gerechnet wird mit den
 * Festpreisen. Druckerumfang je Stufe stammt noch aus dem Mockup.
 */
export const SOUNDBOX_DISCOUNT_PCT = { 1: 15, 2: 25 } as const

export const fotoboxPackages: RentalPackage[] = [
  {
    slug: 'fotobox-paket', name: 'Fotobox', kind: 'fotobox', tier: 'fotobox',
    priceCents: 12999, freeDeliveryKm: 4, available: true,
    withSoundbox: { 1: { moDo: 14999, frSo: 15499 }, 2: { moDo: 16999, frSo: 17499 } },
    includes: ['Fotobox', 'Ohne Drucker', 'Requisiten inklusive', 'Kostenlose Lieferung bis 4 km'],
    image: '/images/produkte/fotobox-nah.webp',
  },
  {
    slug: 'fotobox-basic', name: 'Fotobox Basic', kind: 'fotobox', tier: 'basic',
    priceCents: 24999, freeDeliveryKm: 4, available: true,
    withSoundbox: { 1: { moDo: 26999, frSo: 27499 }, 2: { moDo: 28499, frSo: 29499 } },
    includes: ['Fotobox', 'Drucker + 150 Blatt', 'Requisiten inklusive', 'Kostenlose Lieferung bis 4 km'],
    image: '/images/produkte/fotobox-drucker.webp',
  },
  {
    slug: 'fotobox-premium-paket', name: 'Fotobox Premium', kind: 'fotobox', tier: 'premium',
    priceCents: 37499, freeDeliveryKm: 6, highlight: true, available: true,
    withSoundbox: { 1: { moDo: 39499, frSo: 39999 }, 2: { moDo: 41499, frSo: 42499 } },
    includes: ['Fotobox', 'Drucker + 400 Blatt', 'Requisiten inklusive', 'Kostenlose Lieferung bis 6 km'],
    image: '/images/produkte/fotobox-drucker.webp',
  },
  {
    slug: 'fotobox-deluxe', name: 'Fotobox Deluxe', kind: 'fotobox', tier: 'deluxe',
    priceCents: 47499, freeDeliveryKm: 8, available: true,
    withSoundbox: { 1: { moDo: 49499, frSo: 49999 }, 2: { moDo: 51499, frSo: 51999 } },
    includes: ['Fotobox', 'Drucker + 700 Blatt', 'Requisiten inklusive', 'Kostenlose Lieferung bis 8 km'],
    image: '/images/produkte/fotobox-drucker.webp',
  },
]

/** Soundbox-Miete von Louis (Oktober 2026). */
export const soundboxRates: SoundboxRates = {
  perDayCents: { moDo: 2500, frSo: 3000 },
  weekendCents: 6500,
  weekCents: 14500,
  extraBatteryPerDayCents: 500,
}

/*
 * Event-Komplettpakete aus Louis' Mockup. Sie enthalten Zelte und Licht, die es
 * noch nicht gibt, und Louis hat dafuer noch keine Preise genannt: Coming soon.
 */
export const eventPackages: RentalPackage[] = [
  {
    slug: 'party-starter', name: 'Party Starter', kind: 'event',
    priceCents: 69900, freeDeliveryKm: 4, available: false,
    includes: ['Soundbox', 'Lautsprecherständer', 'Faltzelt 3 x 3 m'],
    image: '/images/produkte/soundbox-stativ.webp',
  },
  {
    slug: 'event-premium', name: 'Event Premium', kind: 'event',
    priceCents: 100000, freeDeliveryKm: 6, available: false, highlight: true,
    includes: ['Soundbox + Ständer', 'Faltzelt 3 x 3 m', 'Fotobox Premium', 'Auf- & Abbau inklusive'],
    image: '/images/produkte/set-fotobox-soundbox-drucker.webp',
  },
  {
    slug: 'rundum-sorglos', name: 'Rundum-Sorglos', kind: 'event',
    priceCents: 149900, freeDeliveryKm: 8, available: false,
    includes: ['Soundanlage', 'Pagodenzelt', 'Fotobox Premium', 'Lichtset Premium', 'Auf- & Abbau inklusive'],
    image: '/images/produkte/set-fotobox-soundboxen-drucker.webp',
  },
]

/*
 * Fotobox-Zubehoer von Louis (Oktober 2026). USB-Stick und roter Teppich
 * stammen aus dem Mockup, Louis hat dafuer keinen Preis genannt: vorerst
 * nicht buchbar, Preise sind Platzhalter.
 */
export const addons: Addon[] = [
  { slug: 'eigenes-layout', name: 'Eigenes Foto-Layout / Branding', priceCents: 1499, available: true },
  { slug: 'premium-requisiten', name: 'Premium Requisiten', priceCents: 999, available: false },
  { slug: 'hintergrund', name: 'Hintergrund / Leinwand', priceCents: 2999, available: false },
  { slug: 'gaestebuch', name: 'Gästebuch', priceCents: 1999, available: false },
  { slug: 'usb-stick', name: 'USB-Stick mit allen Bildern', priceCents: 1900, available: false },
  { slug: 'roter-teppich', name: 'Roter Teppich & Absperrständer', priceCents: 9900, available: false },
]

export const allPackages = [...eventPackages, ...fotoboxPackages]

export function findProduct(slug: string) {
  return products.find(p => p.slug === slug)
}
export function findPackage(slug: string) {
  return allPackages.find(p => p.slug === slug)
}
