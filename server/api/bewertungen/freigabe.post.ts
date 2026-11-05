import { z } from 'zod'
import { freigabeSchema } from '~~/shared/schemas'

// Freischalten oder loeschen. Bewusst POST hinter einem Knopf und nicht
// direkt der Link aus der Mail: Mailprogramme rufen Links teils zur
// Vorschau automatisch auf, das wuerde sonst alles freischalten.
// POST /api/bewertungen/freigabe { id, t, aktion }
const schema = freigabeSchema.extend({ aktion: z.enum(['freigeben', 'verbergen', 'loeschen']) })

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'Link ungültig' })
  const { id, t, aktion } = parsed.data
  const tabelle = useSupabase().from('bewertungen')
  const { data, error } = aktion === 'loeschen'
    ? await tabelle.delete().eq('id', id).eq('freigabe_token', t).select('*')
    : await tabelle
        .update({ freigegeben: aktion === 'freigeben', freigegeben_am: aktion === 'freigeben' ? new Date().toISOString() : null })
        .eq('id', id).eq('freigabe_token', t).select('id')
  if (error) {
    console.error('[bewertungen] Freigabe fehlgeschlagen:', error.message)
    throw createError({ statusCode: 502, statusMessage: 'Datenbank nicht erreichbar' })
  }
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Bewertung nicht gefunden' })
  if (aktion === 'loeschen') await bilderLoeschen((data[0] as { bilder?: string[] }).bilder ?? [])
  return { ok: true, aktion }
})
