import type { Bewertung } from '~~/shared/bewertungen'

// Alle freigegebenen Bewertungen, neueste zuerst. Wenige genug, dass der
// Browser selbst nach Produkt filtert und Schnitte rechnet.
// Kein Cache: was Louis freischaltet, steht beim naechsten Laden da.
// GET /api/bewertungen
const laden = (spalten: string) => useSupabase()
  .from('bewertungen')
  .select(spalten)
  .eq('freigegeben', true)
  .order('erstellt_am', { ascending: false })
  .limit(500)
  .returns<Bewertung[]>()

export default defineEventHandler(async () => {
  let { data, error } = await laden('id, name, sterne, text, bezug, erstellt_am, bilder')
  // Ohne Migration 2026-11-05-bewertungsbilder.sql gibt es "bilder" noch nicht.
  if (error) ({ data, error } = await laden('id, name, sterne, text, bezug, erstellt_am'))
  // Bewertungen sind Beiwerk: lieber keine zeigen als die Seite stoeren.
  if (error) {
    console.error('[bewertungen] Laden fehlgeschlagen:', error.message)
    return []
  }
  return mitBildUrls(data ?? [])
})
