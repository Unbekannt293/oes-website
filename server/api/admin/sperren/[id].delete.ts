import { z } from 'zod'

// DELETE /api/admin/sperren/<id>: nur Sperren ohne Buchung, Buchungen
// werden storniert statt geloescht.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.coerce.number().int().positive() }).parse)
  const { data, error } = await useSupabase().from('belegungen').delete().eq('id', id).is('buchung_id', null).select('id')
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Sperre nicht gefunden' })
  return { ok: true }
})
