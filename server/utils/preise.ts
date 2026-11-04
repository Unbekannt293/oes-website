import type { PreisRegel } from '~~/shared/preise'

/*
 * Preisregeln aus der Datenbank, 30 Sekunden zwischengespeichert. Aendert
 * Louis etwas in der Verwaltung, wird der Speicher sofort geleert. Ist die
 * Datenbank weg, gelten die zuletzt geladenen Werte bzw. die Standardpreise.
 */
let stand: { regeln: PreisRegel[], geladen: number } = { regeln: [], geladen: 0 }

export async function preisRegeln(): Promise<PreisRegel[]> {
  if (Date.now() - stand.geladen < 30_000) return stand.regeln
  try {
    const { data, error } = await useSupabase()
      .from('preise').select('id, schluessel, wert, gueltig_von, gueltig_bis, erstellt_am')
      .order('erstellt_am', { ascending: true })
    if (error) throw new Error(error.message)
    stand = { regeln: data ?? [], geladen: Date.now() }
  }
  catch (err) {
    console.error('[preise] Laden fehlgeschlagen, nehme letzte bzw. Standardpreise:', (err as Error).message)
    stand.geladen = Date.now()   // nicht bei jeder Anfrage neu versuchen
  }
  return stand.regeln
}

export function preisSpeicherLeeren() {
  stand.geladen = 0
}
