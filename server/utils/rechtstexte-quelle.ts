import { AGB } from '~~/shared/rechtstexte/agb'
import { DATENSCHUTZ } from '~~/shared/rechtstexte/datenschutz'
import { WIDERRUF } from '~~/shared/rechtstexte/widerruf'

/** Die Rechtstexte, die es als PDF gibt: Name in der Adresse -> Text und Dateiname. */
export const RECHTSTEXTE = {
  agb: { text: AGB, datei: 'OES_Mietbedingungen.pdf' },
  datenschutz: { text: DATENSCHUTZ, datei: 'OES_Datenschutzerklaerung.pdf' },
  widerruf: { text: WIDERRUF, datei: 'OES_Widerrufsbelehrung.pdf' },
} as const

export function rechtstextNach(name: string | undefined) {
  const r = RECHTSTEXTE[name as keyof typeof RECHTSTEXTE]
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Unbekannter Text' })
  return r
}
