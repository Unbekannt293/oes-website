import { z } from 'zod'
import { lieferungAnfrageSchema } from '~~/shared/schemas'
import { quoteDelivery } from '~~/shared/pricing'

// Fahrtkosten fuer die Kasse: Adresse -> Strecke ab Lager -> Fahrtkosten.
// Die Freikilometer kommen aus dem auf dem Server nachgerechneten Korb,
// nicht aus dem Browser.
// POST /api/lieferung { strasse, plz, ort, zeilen }
export default defineEventHandler(async (event) => {
  const parsed = lieferungAnfrageSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validierung fehlgeschlagen', data: { fields: z.flattenError(parsed.error).fieldErrors } })
  }
  const { zeilen, ...adresse } = parsed.data
  const korb = korbBerechnen(zeilen)
  const strecke = await streckeZu(event, adresse)
  return { ...strecke, quote: quoteDelivery(strecke.distanceKm, korb.lines) }
})
