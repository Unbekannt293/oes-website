import { z } from 'zod'

// Freie Geraete je Tag, fuer den Kalender im Buchungskasten.
// GET /api/verfuegbarkeit?geraet=soundbox&von=2026-12-01&bis=2026-12-31
const query = z.object({
  geraet: z.enum(['fotobox', 'soundbox']),
  von: z.iso.date(),
  bis: z.iso.date(),
}).refine(q => q.bis >= q.von, { message: 'bis liegt vor von' })
  // Ein Kalender zeigt hoechstens ein paar Monate. Schuetzt vor riesigen Abfragen.
  .refine(q => (Date.parse(q.bis) - Date.parse(q.von)) / 86_400_000 <= 186, { message: 'Zeitraum zu lang' })

export default defineEventHandler(async (event) => {
  const parsed = query.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Anfrage', data: z.flattenError(parsed.error) })
  }
  const { geraet, von, bis } = parsed.data

  const { data, error } = await useSupabase().rpc('freie_geraete', { p_geraet: geraet, p_von: von, p_bis: bis })
  if (error) {
    console.error('[verfuegbarkeit]', error.message)
    throw createError({ statusCode: 502, statusMessage: 'Verfügbarkeit gerade nicht abrufbar' })
  }

  // Kurz zwischenspeichern: viele Besucher sehen denselben Monat.
  setHeader(event, 'Cache-Control', 'public, max-age=60')
  return { geraet, tage: data as { tag: string, frei: number }[] }
})
