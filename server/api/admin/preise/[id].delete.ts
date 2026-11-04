import { z } from 'zod'

// DELETE /api/admin/preise/<id>: Aktion oder Abweichung entfernen.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.coerce.number().int().positive() }).parse)
  const { error } = await useSupabase().from('preise').delete().eq('id', id)
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  preisSpeicherLeeren()
  return { ok: true }
})
