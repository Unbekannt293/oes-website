// GET /api/admin/sperren: Sperrtage ohne Buchung (z. B. ueber Kleinanzeigen
// vermietet, Wartung), die noch nicht vorbei sind.
export default defineEventHandler(async () => {
  const { data, error } = await useSupabase()
    .from('belegungen').select('id, geraet, anzahl, zeitraum, grund').is('buchung_id', null)
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  return (data ?? [])
    .map(s => ({ id: s.id, geraet: s.geraet, anzahl: s.anzahl, grund: s.grund, ...zeitraumLesen(s.zeitraum) }))
    .filter(s => s.bis >= heute)
    .sort((a, b) => a.von.localeCompare(b.von))
})
