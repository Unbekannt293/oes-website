import { soundboxRates } from './catalog'
import type { CartLine, DeliveryQuote, RentalPackage, Weekpart } from './types'

/** 0,25 EUR pro Kilometer, aus der Anforderung von Louis. */
export const PRICE_PER_KM_CENTS = 25

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
 * PRICE_PER_KM_CENTS. Beispiel: 10 km Entfernung, 4 km frei
 * → 40 km − 16 km = 24 km × 0,25 € = 6,00 €.
 *
 * @param distanceKm  Entfernung vom Lager zum Veranstaltungsort,
 *                    kommt aus der Routing-API in server/api/distanz.get.ts
 * @param lines       Alle Positionen im Warenkorb
 */
export function quoteDelivery(distanceKm: number, lines: CartLine[]): DeliveryQuote {
  if (lines.length === 0) {
    return { distanceKm, freeKm: 0, billableKm: distanceKm, feeCents: 0 }
  }

  // TODO(human): freeKm aus den Positionen bestimmen und daraus
  // billableKm sowie feeCents berechnen. Rückgabe: DeliveryQuote.

  return { distanceKm, freeKm: 0, billableKm: distanceKm, feeCents: 0 }
}

export function totalCents(lines: CartLine[], delivery: DeliveryQuote): number {
  return subtotalCents(lines) + delivery.feeCents
}

/**
 * Kaution laut Louis: Fotobox 250 EUR, je Soundbox 200 EUR. Insgesamt
 * hoechstens 450 EUR, auch wenn Fotobox und zwei Soundboxen zusammen
 * rechnerisch 650 EUR ergaeben.
 */
export const DEPOSIT_CENTS = { fotobox: 25000, soundbox: 20000 } as const
export const DEPOSIT_CAP_CENTS = 45000

export function depositCents(fotobox: boolean, soundboxes: number): number {
  const sum = (fotobox ? DEPOSIT_CENTS.fotobox : 0) + soundboxes * DEPOSIT_CENTS.soundbox
  return Math.min(sum, DEPOSIT_CAP_CENTS)
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
