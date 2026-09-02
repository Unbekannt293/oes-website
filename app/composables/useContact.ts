/**
 * Eine einzige Quelle für Kontaktdaten.
 * Louis' Notizen nennen zwei verschiedene Nummern und Adressen,
 * das hier vor dem Launch mit ihm abgleichen.
 */
export function useContact() {
  return {
    phone: '01522 6248124',
    phoneRaw: '+4915226248124',
    email: 'ottos.event-service@outlook.de',
    /** Bewusst nur der Stadtteil, keine Hausanschrift. So gewuenscht. */
    district: 'Hamburg Wandsbek-Tonndorf',
  }
}
