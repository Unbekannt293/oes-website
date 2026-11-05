import { freigabeSchema } from '~~/shared/schemas'

// Freigabe-Seite: zeigt die Bewertung zum Link aus Louis' Mail.
// Nur mit passendem Token, sonst 404 (verraet nicht, ob es die id gibt).
// GET /api/bewertungen/freigabe?id=...&t=...
export default defineEventHandler(async (event) => {
  const parsed = freigabeSchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'Link ungültig' })
  const laden = (spalten: string) => useSupabase()
    .from('bewertungen')
    .select(spalten)
    .eq('id', parsed.data.id)
    .eq('freigabe_token', parsed.data.t)
    .maybeSingle<{ bilder?: string[] }>()
  let { data, error } = await laden('name, sterne, text, bezug, erstellt_am, freigegeben, bilder')
  if (error) ({ data } = await laden('name, sterne, text, bezug, erstellt_am, freigegeben'))
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Bewertung nicht gefunden' })
  return mitBildUrls([data])[0]
})
