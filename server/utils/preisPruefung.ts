import { z } from 'zod'
import { PREISFELD } from '~~/shared/preise'

/** Nur bekannte Preise, Werte in sinnvollen Grenzen (Cent bis 10.000 €, km bis 100). */
export const preisSchluessel = z.string().refine(s => PREISFELD.has(s), 'Unbekannter Preis')

export function wertPruefen(schluessel: string, wert: number) {
  const max = PREISFELD.get(schluessel)!.einheit === 'km' ? 100 : 1_000_000
  if (!Number.isInteger(wert) || wert < 0 || wert > max) {
    throw createError({ statusCode: 400, statusMessage: 'Wert ungültig' })
  }
}
