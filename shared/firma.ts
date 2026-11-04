/**
 * Firmendaten fuer Rechnung, Mails, Impressum und Rechtstexte. Stand laut
 * Louis' Unterlagen vom 04.11.2026 (Beispielrechnung, AGB, Datenschutz):
 * Einzelunternehmen, Kleinunternehmer nach § 19 UStG, Willoeperstrasse 19.
 */
export const FIRMA = {
  name: 'OES – Otto’s Event Service',
  inhaber: 'Hans-Joachim Louis Otto',
  /** Unterschrift in Mails und auf der Rechnung. */
  gruss: 'Louis Otto',
  strasse: 'Willöperstraße 19',
  plz: '22047',
  ort: 'Hamburg',
  land: 'Deutschland',
  telefon: '+49 159 06839267',
  email: 'kontakt@ottos-eventservice.de',
  web: 'ottos-eventservice.de',
  bank: 'Hamburger Sparkasse (Haspa)',
  iban: 'DE40 2005 0550 1090 7997 17',
  /** Selbstabholung der Soundbox: Stadtteil oeffentlich, Adresse erst in der Bestaetigung. */
  abholort: 'Hamburg-Tonndorf',
  steuerhinweis: 'Steuerbefreiung für Kleinunternehmer gemäß § 19 UStG. Es wird keine Umsatzsteuer ausgewiesen.',
} as const
