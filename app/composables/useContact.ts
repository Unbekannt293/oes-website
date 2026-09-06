/**
 * Eine einzige Quelle für Kontaktdaten.
 *
 * Achtung: In den Unterlagen stehen drei verschiedene Telefonnummern.
 * Genommen ist die aus dem Fließtext des PDF, weil Louis sie dort selbst
 * als Anweisung geschrieben hat. Die beiden anderen (01522 6248124 und
 * 01522 6348934) stammen aus den generierten Mockup-Bildern.
 */
export function useContact() {
  return {
    phone: '0159 06839267',
    phoneRaw: '+4915906839267',
    email: 'kontakt@ottos-eventservice.de',
    /** Bewusst nur der Stadtteil, keine Hausanschrift. So gewünscht. */
    district: 'Hamburg Wandsbek-Tonndorf',
    /**
     * Ladungsfähige Anschrift fürs Impressum, von Louis wörtlich
     * durchgegeben. Achtung: weicht von der Straße im Homepage-Mockup
     * ab ("Wildsparkstraße" dort, "Willöperstraße" hier) - vor dem
     * Livegang einmal gegenprüfen, welche stimmt.
     */
    legal: {
      name: 'Louis Otto',
      businessName: 'Event-Service',
      street: 'Willöperstraße 19',
      zip: '22047',
      city: 'Hamburg',
      country: 'Deutschland',
      /** So durchgegeben; der Mobilfunk-Präfix 159 fehlt darin. */
      phone: '+49 06839267',
    },
  }
}
