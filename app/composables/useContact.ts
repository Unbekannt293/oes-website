/**
 * Eine einzige Quelle für Kontaktdaten.
 *
 * Achtung: In den Unterlagen stehen drei verschiedene Telefonnummern.
 * Genommen ist die aus dem Fließtext des PDF, weil Louis sie dort selbst
 * als Anweisung geschrieben hat. Die beiden anderen (01522 6248124 und
 * 01522 6348934) stammen aus den generierten Mockup-Bildern.
 * Vor dem Livegang mit ihm abgleichen.
 */
export function useContact() {
  return {
    phone: '0159 06839267',
    phoneRaw: '+4915906839267',
    email: 'info@ottos-eventservice.de',
    /** Bewusst nur der Stadtteil, keine Hausanschrift. So gewünscht. */
    district: 'Hamburg Wandsbek-Tonndorf',
  }
}
