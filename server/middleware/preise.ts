import { aktionLaeuft, heuteBerlin, preiseAnwenden } from '~~/shared/preise'

// Vor jeder Seite und jeder API-Anfrage die aktuellen Preise in den
// Katalog schreiben (shared/preise.ts). Dateien wie Bilder und Skripte
// brauchen keine Preise.
export default defineEventHandler(async (event) => {
  const pfad = getRequestURL(event).pathname
  if (pfad.startsWith('/_') || pfad.startsWith('/images/') || /\.\w{2,5}$/.test(pfad)) return
  const heute = heuteBerlin()
  const regeln = await preisRegeln()
  preiseAnwenden(regeln, heute)
  // Fuer den Browser nur, was heute gilt: kuenftige Aktionen bleiben intern.
  event.context.preisRegeln = regeln
    .filter(r => !r.gueltig_von || aktionLaeuft(r, heute))
    .map(({ schluessel, wert, gueltig_von, gueltig_bis }) => ({ schluessel, wert, gueltig_von, gueltig_bis }))
})
