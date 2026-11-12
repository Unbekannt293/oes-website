import { z } from 'zod'
import { BILD_MAX_BYTES, BILDER_MAX } from '~~/shared/bewertungen'

// PATCH /api/admin/bewertungen/<id>
//  { aktion: freigeben | verbergen | loeschen }
//  { aktion: 'fotos', behalten: [Pfade], neu: [JPEG-Data-URLs] }
//    Louis pflegt Fotos nachtraeglich (12.11.2026): behaltene bleiben,
//    entfernte werden aus dem Speicher geloescht, neue wie im Formular
//    bereinigt und hochgeladen. Hoechstens BILDER_MAX insgesamt.
const schema = z.discriminatedUnion('aktion', [
  z.object({ aktion: z.enum(['freigeben', 'verbergen', 'loeschen']) }),
  z.object({
    aktion: z.literal('fotos'),
    behalten: z.array(z.string().max(200)).max(BILDER_MAX),
    neu: z.array(z.string().startsWith('data:image/jpeg;base64,').max(Math.ceil(BILD_MAX_BYTES * 4 / 3) + 40)).max(BILDER_MAX),
  }),
])

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const a = await readValidatedBody(event, schema.parse)
  const tabelle = useSupabase().from('bewertungen')

  if (a.aktion === 'fotos') {
    const { data: b } = await tabelle.select('bilder').eq('id', id).single<{ bilder: string[] }>()
    if (!b) throw createError({ statusCode: 404, statusMessage: 'Bewertung nicht gefunden' })
    // Nur Pfade behalten, die wirklich zu dieser Bewertung gehoeren.
    const behalten = a.behalten.filter(p => b.bilder.includes(p))
    if (behalten.length + a.neu.length > BILDER_MAX) {
      throw createError({ statusCode: 422, statusMessage: `Höchstens ${BILDER_MAX} Fotos` })
    }
    const neu = await bilderSpeichern(id, a.neu)
    const { error } = await tabelle.update({ bilder: [...behalten, ...neu] }).eq('id', id)
    if (error) {
      await bilderLoeschen(neu)
      throw createError({ statusCode: 502, statusMessage: error.message })
    }
    await bilderLoeschen(b.bilder.filter(p => !behalten.includes(p)))
    return { ok: true, fotosFehlen: a.neu.length - neu.length }
  }

  const { data, error } = a.aktion === 'loeschen'
    ? await tabelle.delete().eq('id', id).select('*')
    : await tabelle.update({ freigegeben: a.aktion === 'freigeben', freigegeben_am: a.aktion === 'freigeben' ? new Date().toISOString() : null })
        .eq('id', id).select('id')
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Bewertung nicht gefunden' })
  if (a.aktion === 'loeschen') await bilderLoeschen((data[0] as { bilder?: string[] }).bilder ?? [])
  return { ok: true }
})
