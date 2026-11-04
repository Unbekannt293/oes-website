import { FIRMA } from '~~/shared/firma'

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
    /** Nur der Stadtteil, keine Adresse. Wird erst per Klick geoeffnet, laedt also nichts vorab. */
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tonndorf%2C+Hamburg',
    social: {
      instagram: 'https://www.instagram.com/ottoseventservice',
      tiktok: 'https://www.tiktok.com/@ottos.event.servi',
    },
    /** Ladungsfaehige Anschrift fuers Impressum, aus shared/firma.ts (Louis' Unterlagen, 04.11.2026). */
    legal: {
      name: FIRMA.inhaber,
      businessName: FIRMA.name,
      street: FIRMA.strasse,
      zip: FIRMA.plz,
      city: FIRMA.ort,
      country: FIRMA.land,
      phone: FIRMA.telefon,
    },
  }
}
