import { addons, fotoboxPackages, kombis, products, soundboxRates } from './catalog'
import { tarif } from './pricing'

/**
 * Alle Preise, die Louis in der Verwaltung (/admin/preise) aendern kann.
 *
 * Die Standardwerte stehen weiter in catalog.ts und pricing.ts. In der
 * Datenbank (Tabelle preise) liegen nur Abweichungen. preiseAnwenden()
 * schreibt sie beim Start in genau diese Objekte zurueck: Server und
 * Browser rechnen danach mit den neuen Werten, ohne dass Buchungskasten,
 * Warenkorb oder Bestellung davon wissen muessen.
 */
export interface PreisFeld {
  schluessel: string
  gruppe: string
  label: string
  /** eur: Wert in Cent. km: ganze Kilometer. */
  einheit: 'eur' | 'km'
  /** Wert aus catalog.ts, vor jeder Aenderung gemerkt. */
  standard: number
  setzen: (wert: number) => void
}

/** Eine Zeile der Tabelle preise. Ohne Zeitraum dauerhaft, mit Zeitraum Aktion. */
export interface PreisRegel {
  id?: number
  schluessel: string
  wert: number
  gueltig_von: string | null
  gueltig_bis: string | null
  erstellt_am?: string
}

function feld(schluessel: string, gruppe: string, label: string, lesen: () => number, setzen: (w: number) => void, einheit: 'eur' | 'km' = 'eur'): PreisFeld {
  return { schluessel, gruppe, label, einheit, standard: lesen(), setzen }
}

export const PREISFELDER: PreisFeld[] = [
  ...fotoboxPackages.map(p => feld(`paket.${p.slug}`, 'Fotobox-Pakete (pro Tag)', p.name,
    () => p.priceCents, (w) => { p.priceCents = w })),

  // Komplettpakete: Festpreise fuer Paket plus Soundboxen je Wochenteil.
  ...fotoboxPackages.flatMap(p => ([1, 2] as const).flatMap(n => (['moDo', 'frSo'] as const).map(t =>
    feld(`paket.${p.slug}.sb${n}.${t}`, 'Komplettpakete (Paket + Soundbox, pro Tag)',
      `${p.short} + ${n === 1 ? '1 Soundbox' : '2 Soundboxen'}, ${t === 'moDo' ? 'Mo–Do' : 'Fr–So'}`,
      () => p.withSoundbox![n][t], (w) => { p.withSoundbox![n][t] = w })))),

  feld('soundbox.tag.moDo', 'Soundbox einzeln (pro Box)', 'Tag Mo–Do', () => soundboxRates.perDayCents.moDo, (w) => { soundboxRates.perDayCents.moDo = w }),
  feld('soundbox.tag.frSo', 'Soundbox einzeln (pro Box)', 'Tag Fr–So', () => soundboxRates.perDayCents.frSo, (w) => { soundboxRates.perDayCents.frSo = w }),
  feld('soundbox.wochenende', 'Soundbox einzeln (pro Box)', 'Wochenende Fr–So', () => soundboxRates.weekendCents, (w) => { soundboxRates.weekendCents = w }),
  feld('soundbox.woche', 'Soundbox einzeln (pro Box)', 'Woche Mo–So', () => soundboxRates.weekCents, (w) => { soundboxRates.weekCents = w }),
  feld('soundbox.akku', 'Soundbox einzeln (pro Box)', 'Zusatzakku pro Tag', () => soundboxRates.extraBatteryPerDayCents, (w) => { soundboxRates.extraBatteryPerDayCents = w }),

  ...addons.filter(a => !a.included).map(a => feld(`zubehoer.${a.slug}`, 'Zubehör', a.available ? a.name : `${a.name} (noch nicht buchbar)`,
    () => a.priceCents, (w) => { a.priceCents = w })),

  feld('lieferung.km', 'Lieferung', 'Preis pro Kilometer', () => tarif.proKmCent, (w) => { tarif.proKmCent = w }),
  ...fotoboxPackages.map(p => feld(`lieferung.frei.${p.slug}`, 'Lieferung', `Frei-Kilometer ${p.short}`,
    () => p.freeDeliveryKm, (w) => { p.freeDeliveryKm = w }, 'km')),

  feld('kaution.fotobox', 'Kaution', 'Fotobox', () => tarif.kautionFotoboxCent, (w) => { tarif.kautionFotoboxCent = w }),
  feld('kaution.soundbox', 'Kaution', 'Je Soundbox', () => tarif.kautionSoundboxCent, (w) => { tarif.kautionSoundboxCent = w }),
  feld('kaution.max', 'Kaution', 'Höchstens insgesamt', () => tarif.kautionMaxCent, (w) => { tarif.kautionMaxCent = w }),
]

export const PREISFELD = new Map(PREISFELDER.map(f => [f.schluessel, f]))

/** Heutiges Datum in deutscher Zeit, auf Server (UTC) und Browser gleich. */
export function heuteBerlin() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
}

/** Laeuft eine Aktion heute? */
export const aktionLaeuft = (r: PreisRegel, heute: string) =>
  !!r.gueltig_von && !!r.gueltig_bis && r.gueltig_von <= heute && heute <= r.gueltig_bis

/**
 * Laufen fuer denselben Preis mehrere Aktionen gleichzeitig, gilt die hier
 * gewaehlte. kandidaten ist nie leer.
 */
function aktionWaehlen(kandidaten: PreisRegel[]): PreisRegel {
  // TODO(human): Regel festlegen, welche von mehreren laufenden Aktionen gilt.
  return kandidaten.at(-1)!
}

/** Gueltiger Wert eines Preises heute: Aktion, sonst dauerhaft geaendert, sonst Standard. */
export function wertHeute(f: PreisFeld, regeln: PreisRegel[], heute: string) {
  const eigene = regeln.filter(r => r.schluessel === f.schluessel)
  const aktionen = eigene.filter(r => aktionLaeuft(r, heute))
  if (aktionen.length) return aktionWaehlen(aktionen).wert
  return eigene.find(r => !r.gueltig_von)?.wert ?? f.standard
}

/**
 * Regeln in den Katalog schreiben. Felder ohne Regel gehen auf den
 * Standard zurueck, so wirkt auch das Loeschen einer Abweichung sofort.
 */
export function preiseAnwenden(regeln: PreisRegel[], heute: string) {
  for (const f of PREISFELDER) f.setzen(wertHeute(f, regeln, heute))

  // Abgeleitete "ab"-Preise der Karten neu bilden.
  const minPaket = Math.min(...fotoboxPackages.map(p => p.priceCents))
  const minKombi = (n: 1 | 2) => Math.min(...fotoboxPackages.map(p => p.withSoundbox![n].moDo))
  const fotobox = products.find(p => p.slug === 'fotobox')
  const soundbox = products.find(p => p.slug === 'soundbox')
  if (fotobox) fotobox.priceCents = minPaket
  if (soundbox) soundbox.priceCents = soundboxRates.perDayCents.moDo
  for (const k of kombis) k.priceCents = k.soundboxes === 0 ? minPaket : minKombi(k.soundboxes)
}
