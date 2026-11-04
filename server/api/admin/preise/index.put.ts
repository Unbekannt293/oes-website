import { z } from 'zod'

// Dauerhaften Preis setzen oder (wert: null) auf den Standard zuruecksetzen.
// PUT /api/admin/preise { schluessel, wert }
export default defineEventHandler(async (event) => {
  const { schluessel, wert } = await readValidatedBody(event, z.object({
    schluessel: preisSchluessel, wert: z.number().nullable(),
  }).parse)
  if (wert !== null) wertPruefen(schluessel, wert)
  const db = useSupabase()
  // Ersetzen statt Upsert: der Eindeutigkeits-Index gilt nur fuer Zeilen ohne Zeitraum.
  const { error } = await db.from('preise').delete().eq('schluessel', schluessel).is('gueltig_von', null)
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  if (wert !== null) {
    const { error: e2 } = await db.from('preise').insert({ schluessel, wert })
    if (e2) throw createError({ statusCode: 502, statusMessage: e2.message })
  }
  preisSpeicherLeeren()
  return { ok: true }
})
