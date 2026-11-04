// GET /api/admin/preise: alle Abweichungen (dauerhaft und Aktionen).
// Namen, Gruppen und Standardwerte kennt die Seite aus shared/preise.ts.
export default defineEventHandler(async () => {
  const { data, error } = await useSupabase()
    .from('preise').select('id, schluessel, wert, gueltig_von, gueltig_bis, erstellt_am')
    .order('erstellt_am', { ascending: true })
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  return data
})
