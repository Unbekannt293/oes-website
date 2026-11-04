import { soundboxRates } from './catalog'
import type { CartLine, DeliveryQuote, RentalPackage, Weekpart } from './types'

/**
 * Lieferung und Kaution. Standardwerte aus Louis' Anforderungen, aenderbar
 * in der Verwaltung (/admin/preise, siehe shared/preise.ts). Ein Objekt
 * statt Konstanten, damit die geaenderten Werte zur Laufzeit hier landen.
 *  - proKmCent: 0,25 EUR pro Kilometer
 *  - Kaution: einheitlich 250 EUR je Buchung, egal welche Geraete (Mietbedingungen
 *    § 8, Stand 04.11.2026). Frueher Fotobox 250, je Soundbox 200, hoechstens 450.
 *    Mit Fotobox = Soundbox = Hoechstbetrag = 250 ergibt jede Buchung 250 EUR.
 */
export const tarif = {
  proKmCent: 25,
  kautionFotoboxCent: 25000,
  kautionSoundboxCent: 25000,
  kautionMaxCent: 25000,
}

const eur = new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR',
})

/** 69900 -> "699,00 EUR" */
export function formatPrice(cents: number): string {
  return eur.format(cents / 100)
}

export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
}

/**
 * Berechnet die Fahrtkosten für einen Warenkorb.
 *
 * Jede Position bringt ihren eigenen Freiradius mit (Basic und Classic 4 km,
 * Premium, Premium Plus und Deluxe 8 km). Liegen mehrere Positionen im Korb, muss
 * entschieden werden, welcher Radius zählt.
 *
 * Regel von Louis (14.10.2026): Pro Auftrag fährt er viermal (Hinbringen,
 * Rückfahrt, Abholen, Rückfahrt). Gefahrene Strecke = Entfernung × 4,
 * Freistrecke = Freiradius × 4, berechnet wird nur der Rest, je Kilometer
 * tarif.proKmCent. Beispiel: 10 km Entfernung, 4 km frei
 * → 40 km − 16 km = 24 km × 0,25 € = 6,00 €.
 *
 * @param distanceKm  Einfache Strecke vom Lager zum Veranstaltungsort in km
 *                    (Kommazahl, z. B. 9.6), kommt aus server/utils/routing.ts
 * @param lines       Alle Positionen im Warenkorb
 */
export function quoteDelivery(distanceKm: number, lines: CartLine[]): DeliveryQuote {
  if (lines.length === 0) {
    return { distanceKm, freeKm: 0, billableKm: distanceKm, feeCents: 0 }
  }

  let freeKm = 0
  for (const line of lines) {
    if (line.freeDeliveryKm > freeKm) {
      freeKm = line.freeDeliveryKm
    }
  }

  const billableKm = Math.max(0, distanceKm * 4 - freeKm * 4);

  const feeCents = Math.round(billableKm * tarif.proKmCent);

  return { distanceKm, freeKm: freeKm, billableKm: Math.round(billableKm * 10) / 10, feeCents: feeCents }
}

export function totalCents(lines: CartLine[], delivery: DeliveryQuote): number {
  return subtotalCents(lines) + delivery.feeCents
}

/** Kaution, siehe tarif. */
export function depositCents(fotobox: boolean, soundboxes: number): number {
  const sum = (fotobox ? tarif.kautionFotoboxCent : 0) + soundboxes * tarif.kautionSoundboxCent
  return Math.min(sum, tarif.kautionMaxCent)
}

/** Montag bis Donnerstag oder Freitag bis Sonntag, fuer ein ISO-Datum ('2026-12-12'). */
export function weekpartOf(isoDate: string): Weekpart {
  // Mittags statt Mitternacht: so kippt keine Zeitzone das Datum auf den Vortag.
  const day = new Date(`${isoDate}T12:00:00`).getDay()  // 0 = Sonntag
  return day >= 1 && day <= 4 ? 'moDo' : 'frSo'
}

/** Paketpreis mit 0, 1 oder 2 Soundboxen am gegebenen Veranstaltungstag. */
export function packagePriceCents(pkg: RentalPackage, soundboxes: 0 | 1 | 2, isoDate: string): number {
  if (soundboxes === 0 || !pkg.withSoundbox) return pkg.priceCents
  return pkg.withSoundbox[soundboxes][weekpartOf(isoDate)]
}

/**
 * Aufpreis fuer 1 oder 2 Soundboxen im Kombi gegenueber dem Paket allein.
 * Der Buchungskasten zeigt ihn statt der Kombi-Gesamtpreise: "+ 15,00 €".
 */
export function kombiAddCents(pkg: RentalPackage, soundboxes: 0 | 1 | 2, part: Weekpart): number {
  if (soundboxes === 0 || !pkg.withSoundbox) return 0
  return pkg.withSoundbox[soundboxes][part] - pkg.priceCents
}

/** Was dieselben Soundboxen einzeln fuer einen Tag kosten wuerden (zum Durchstreichen). */
export function soundboxDayCents(soundboxes: number, part: Weekpart): number {
  return soundboxes * soundboxRates.perDayCents[part]
}

/** Anzahl Miettage, beide Tage eingeschlossen. 0, wenn das Ende vor dem Anfang liegt. */
export function rentalDays(fromIso: string, toIso: string): number {
  const ms = new Date(`${toIso}T12:00:00`).getTime() - new Date(`${fromIso}T12:00:00`).getTime()
  return ms < 0 || Number.isNaN(ms) ? 0 : Math.round(ms / 86_400_000) + 1
}

/**
 * Miete einer Soundbox fuer einen Zeitraum.
 *
 * ANNAHME, mit Louis zu klaeren: Tagessaetze (Mo-Do 25, Fr-So 30 EUR) werden
 * addiert. Genau Freitag bis Sonntag kostet pauschal 65 EUR, genau Montag bis
 * Sonntag 145 EUR. Ist die Summe der Tagessaetze guenstiger, gilt die Summe.
 */
export function soundboxRentalCents(fromIso: string, toIso: string): number {
  const days = rentalDays(fromIso, toIso)
  if (days === 0) return 0
  let sum = 0
  for (let i = 0; i < days; i++) {
    const d = new Date(`${fromIso}T12:00:00`)
    d.setDate(d.getDate() + i)
    sum += soundboxRates.perDayCents[weekpartOf(d.toISOString().slice(0, 10))]
  }
  const start = new Date(`${fromIso}T12:00:00`).getDay()
  if (days === 3 && start === 5) return Math.min(sum, soundboxRates.weekendCents)
  if (days === 7 && start === 1) return Math.min(sum, soundboxRates.weekCents)
  return sum
}

/** Alle Tage von bis (ISO, beide eingeschlossen). */
export function eachDay(fromIso: string, toIso: string): string[] {
  const out: string[] = []
  const d = new Date(`${fromIso}T12:00:00`)
  for (let i = 0; i < rentalDays(fromIso, toIso); i++) {
    out.push(d.toLocaleDateString('sv-SE'))
    d.setDate(d.getDate() + 1)
  }
  return out
}

/**
 * Fotobox-Paket ueber mehrere Tage.
 *
 * ANNAHME, mit Louis zu klaeren: Louis' Preisliste nennt Preise pro
 * Veranstaltungstag. Bei mehreren Tagen wird jeder Tag einzeln berechnet
 * (inkl. Kombi-Preis je Mo-Do/Fr-So), es gibt keinen Mehrtagesrabatt.
 */
export function packageRangeCents(pkg: RentalPackage, soundboxes: 0 | 1 | 2, fromIso: string, toIso: string): number {
  return eachDay(fromIso, toIso).reduce((sum, day) => sum + packagePriceCents(pkg, soundboxes, day), 0)
}
