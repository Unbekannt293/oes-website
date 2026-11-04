import { z } from 'zod'

// Aktionspreis anlegen: gilt fuer Buchungen, die zwischen von und bis eingehen.
// POST /api/admin/preise/aktion { schluessel, wert, von, bis }
export default defineEventHandler(async (event) => {
  const a = await readValidatedBody(event, z.object({
    schluessel: preisSchluessel, wert: z.number(), von: z.iso.date(), bis: z.iso.date(),
  }).refine(a => a.bis >= a.von, { message: 'Ende vor Beginn' }).parse)
  wertPruefen(a.schluessel, a.wert)
  const { error } = await useSupabase().from('preise')
    .insert({ schluessel: a.schluessel, wert: a.wert, gueltig_von: a.von, gueltig_bis: a.bis })
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  preisSpeicherLeeren()
  return { ok: true }
})
