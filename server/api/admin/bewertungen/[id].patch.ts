import { z } from 'zod'

// PATCH /api/admin/bewertungen/<id> { aktion: freigeben | verbergen | loeschen }
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const { aktion } = await readValidatedBody(event, z.object({ aktion: z.enum(['freigeben', 'verbergen', 'loeschen']) }).parse)
  const tabelle = useSupabase().from('bewertungen')
  const { data, error } = aktion === 'loeschen'
    ? await tabelle.delete().eq('id', id).select('*')
    : await tabelle.update({ freigegeben: aktion === 'freigeben', freigegeben_am: aktion === 'freigeben' ? new Date().toISOString() : null })
        .eq('id', id).select('id')
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Bewertung nicht gefunden' })
  if (aktion === 'loeschen') await bilderLoeschen((data[0] as { bilder?: string[] }).bilder ?? [])
  return { ok: true }
})
