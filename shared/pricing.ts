import type { CartLine, DeliveryQuote } from './types'

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
 * Jede Position bringt ihren eigenen Freiradius mit (Basis/Klassik 4 km,
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
