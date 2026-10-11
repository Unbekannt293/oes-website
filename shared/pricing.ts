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
 * Jede Position bringt ihren eigenen Freiradius mit (Fotobox/Basic 4 km,
 * Premium 6 km, Deluxe 8 km). Liegen mehrere Positionen im Korb, muss
 * entschieden werden, welcher Radius zählt.
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

/** Guenstigster Preis mit Soundbox, fuer "mit Soundbox ab ..." in der Anzeige. */
export function cheapestWithSoundboxCents(pkg: RentalPackage): number | null {
  return pkg.withSoundbox ? pkg.withSoundbox[1].moDo : null
}
