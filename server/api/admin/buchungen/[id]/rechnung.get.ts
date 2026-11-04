import { z } from 'zod'

// GET /api/admin/buchungen/<id>/rechnung: Rechnung als PDF ansehen. Ohne
// vergebene Rechnungsnummer (noch nicht bestaetigt) als Vorschau.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const { data: b, error } = await useSupabase()
    .from('buchungen').select('*, positionen(name, detail, menge, einzelpreis_cent)').eq('id', id).single()
  if (error || !b) throw createError({ statusCode: 404, statusMessage: 'Buchung nicht gefunden' })
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  const pdf = await rechnungPdf({ ...b, rechnungsnummer: b.rechnungsnummer ?? 'Vorschau', rechnung_am: b.rechnung_am ?? heute })
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="OES_Rechnung_${b.rechnungsnummer ?? b.nummer}.pdf"`,
    'Cache-Control': 'no-store',
  })
  return Buffer.from(pdf)
})
