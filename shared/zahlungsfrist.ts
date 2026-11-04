/**
 * Zahlungsfrist fuer Ueberweisungen (Lukas, 04.11.2026). Eine Buchung per
 * Ueberweisung haelt den Termin sofort frei. Ohne Frist bliebe ein Tag fuer
 * immer blockiert, wenn jemand nie zahlt. Darum:
 *
 *  - Frist: 5 Tage nach der Bestellung, bei Events in weniger als 14 Tagen
 *    nur 2 Tage, hoechstens bis zum Vortag des Events.
 *  - Erinnerung an den Kunden am Tag vor Ablauf (wenn das nicht schon der
 *    Bestelltag ist).
 *  - Storniert wird erst, wenn nach der Frist noch ein Bankarbeitstag
 *    vergangen ist: eine Ueberweisung vom letzten Tag ist dann sicher da.
 *    Faellt das auf den Eventtag oder danach, wird nicht automatisch
 *    storniert, Louis bekommt dann einen Hinweis und klaert es selbst.
 *
 * Alle Daten sind Kalendertage in Berliner Zeit als 'YYYY-MM-DD'.
 * Ausgefuehrt von netlify/functions/taeglich.mts ueber /api/intern/taeglich:
 * morgens Vorwarnung an Louis, 4 Stunden spaeter erst die Kunden-Mails.
 */
export const FRIST = { tage: 5, tageKurzfristig: 2, kurzfristigUnterTagen: 14 }

const tagMs = 86_400_000
const alsDatum = (d: string) => new Date(`${d}T12:00:00Z`)
const alsText = (d: Date) => d.toISOString().slice(0, 10)

export function plusTage(d: string, n: number) {
  return alsText(new Date(alsDatum(d).getTime() + n * tagMs))
}
export function tageZwischen(von: string, bis: string) {
  return Math.round((alsDatum(bis).getTime() - alsDatum(von).getTime()) / tagMs)
}

/** Letzter Tag, an dem die Ueberweisung eingehen soll. */
export function zahlungsfrist(bestelltAm: string, eventVon: string) {
  const kurz = tageZwischen(bestelltAm, eventVon) < FRIST.kurzfristigUnterTagen
  const frist = plusTage(bestelltAm, kurz ? FRIST.tageKurzfristig : FRIST.tage)
  const frueher = [frist, plusTage(eventVon, -1)].sort()[0]!
  // Event morgen oder heute: Frist ist heute, Louis klaert den Rest direkt.
  return frueher < bestelltAm ? bestelltAm : frueher
}

/** Bestelltag in Berliner Zeit aus dem Zeitstempel der Datenbank. */
export const bestelltag = (erstelltAm: string) =>
  new Date(erstelltAm).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })

/** Gespeicherte Frist, sonst aus Bestelldatum und Termin gerechnet (alte Buchungen). */
export function fristVon(b: { zahlung_bis?: string | null, erstellt_am: string, von: string }) {
  return b.zahlung_bis ?? zahlungsfrist(bestelltag(b.erstellt_am), b.von)
}

/** Tag der Erinnerung, oder null, wenn die Frist dafuer zu kurz ist. */
export function erinnerungAm(bestelltAm: string, frist: string) {
  const tag = plusTage(frist, -1)
  return tag > bestelltAm ? tag : null
}

/** Ab diesem Tag wird storniert: nach dem ersten Bankarbeitstag (Mo-Fr) nach der Frist. */
export function stornoAb(frist: string) {
  let werktag = plusTage(frist, 1)
  while ([0, 6].includes(alsDatum(werktag).getUTCDay())) werktag = plusTage(werktag, 1)
  return plusTage(werktag, 1)
}

/** "Fr., 13.11.2026" fuer Mails und Seiten. */
export function fristText(d: string) {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .format(alsDatum(d))
}
