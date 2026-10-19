import type { Bewertung } from '~~/shared/bewertungen'

// Alle freigegebenen Bewertungen, neueste zuerst. Wenige genug, dass der
// Browser selbst nach Produkt filtert und Schnitte rechnet.
// Kein Cache: was Louis freischaltet, steht beim naechsten Laden da.
// GET /api/bewertungen
export default defineEventHandler(async () => {
  const { data, error } = await useSupabase()
    .from('bewertungen')
    .select('id, name, sterne, text, bezug, erstellt_am')
    .eq('freigegeben', true)
    .order('erstellt_am', { ascending: false })
    .limit(500)
    .returns<Bewertung[]>()
  // Bewertungen sind Beiwerk: lieber keine zeigen als die Seite stoeren.
  if (error) {
    console.error('[bewertungen] Laden fehlgeschlagen:', error.message)
    return []
  }
  return data
})
