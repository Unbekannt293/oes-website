// GET /api/admin/bewertungen: alle, wartende zuerst, dann neueste.
export default defineEventHandler(async () => {
  const { data, error } = await useSupabase()
    .from('bewertungen')
    .select('id, name, sterne, text, bezug, erstellt_am, freigegeben')
    .order('freigegeben', { ascending: true })
    .order('erstellt_am', { ascending: false })
    .limit(500)
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  return data
})
