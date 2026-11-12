// GET /api/admin/bewertungen: alle, wartende zuerst, dann neueste.
const laden = (spalten: string) => useSupabase()
  .from('bewertungen')
  .select(spalten)
  .order('freigegeben', { ascending: true })
  .order('erstellt_am', { ascending: false })
  .limit(500)
  .returns<{ bilder?: string[] }[]>()

export default defineEventHandler(async () => {
  let { data, error } = await laden('id, name, sterne, text, bezug, erstellt_am, freigegeben, bilder')
  if (error) ({ data, error } = await laden('id, name, sterne, text, bezug, erstellt_am, freigegeben'))
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  // bildPfade: fuer "Fotos bearbeiten" (welche behalten werden sollen).
  return mitBildUrls(data ?? []).map((z, i) => ({ ...z, bildPfade: data?.[i]?.bilder ?? [] }))
})
