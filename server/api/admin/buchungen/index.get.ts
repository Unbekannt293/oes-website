// GET /api/admin/buchungen?ansicht=kommend|vergangen|storniert
// Kommend: noch nicht vorbei, naechste zuerst. Vergangen: neueste zuerst.
export default defineEventHandler(async (event) => {
  const ansicht = String(getQuery(event).ansicht ?? 'kommend')
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  let q = useSupabase()
    .from('buchungen')
    .select('*, positionen(name, detail, menge, einzelpreis_cent)')
  if (ansicht === 'storniert') q = q.eq('status', 'storniert').order('von', { ascending: false })
  else if (ansicht === 'vergangen') q = q.neq('status', 'storniert').lt('bis', heute).order('von', { ascending: false })
  else q = q.neq('status', 'storniert').gte('bis', heute).order('von', { ascending: true })
  const { data, error } = await q.limit(200)
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  return data
})
