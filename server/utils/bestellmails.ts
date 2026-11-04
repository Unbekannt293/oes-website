import type { H3Event } from 'h3'
import { FIRMA } from '~~/shared/firma'
import { formatPrice } from '~~/shared/pricing'
import { AGB } from '~~/shared/rechtstexte/agb'

/**
 * Mails zu einer Bestellung. Liest alles aus der Datenbank, damit
 * Ueberweisung (sofort nach dem Bestellen) und Online-Zahlung (erst wenn
 * Stripe die Zahlung meldet) dieselben Mails bekommen.
 *
 * Ablauf nach den Mietbedingungen (§ 5, § 6):
 *  - Louis bekommt bei jeder Bestellung eine Benachrichtigung.
 *  - Bezahlt (online): sofort Buchungsbestaetigung mit Rechnung und
 *    Mietbedingungen als PDF (buchungBestaetigen).
 *  - Ueberweisung: erst Eingangsbestaetigung mit Zahlungsinformationen.
 *    Die Buchungsbestaetigung folgt, wenn Louis in der Verwaltung den
 *    Zahlungseingang bestaetigt.
 * Scheitert der Versand, wird das nur protokolliert: die Bestellung ist
 * gespeichert, Louis sieht sie in der Verwaltung und kann neu senden.
 */
interface BuchungMitPositionen {
  id: string, nummer: string, status: string
  vorname: string, nachname: string, email: string, telefon: string
  strasse: string, plz: string, ort: string, adresszusatz: string | null
  von: string, bis: string, summe_cent: number, fahrtkosten_cent: number, kaution_cent: number
  entfernung_km: number | null, zahlungsart: string, bezahlt_am: string | null
  /** Erst nach den Migrationen vorhanden (supabase/schema.sql), sonst undefined. */
  kaution_zahlart?: 'bar' | 'ueberweisung'
  rechnungsnummer?: string | null, rechnung_am?: string | null
  uebergabe?: 'lieferung' | 'abholung'
  positionen: { name: string, detail: string | null, menge: number, einzelpreis_cent: number }[]
}

const tag = (iso: string) => new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
  .format(new Date(`${iso}T12:00:00`))

async function buchungLaden(id: string) {
  const { data, error } = await useSupabase()
    .from('buchungen')
    // "*" statt Spaltenliste: neuere Spalten gibt es erst nach den Migrationen.
    .select('*, positionen(name, detail, menge, einzelpreis_cent)')
    .eq('id', id)
    .single<BuchungMitPositionen>()
  if (error || !data) throw new Error(error?.message ?? 'Buchung nicht gefunden')
  return data
}

function zeitraumText(b: BuchungMitPositionen) {
  return b.von === b.bis ? tag(b.von) : `${tag(b.von)} bis ${tag(b.bis)}`
}

/**
 * Buchung im Ueberblick, fuer alle Mails gleich. abholadresse: die genaue
 * Adresse fuer die Selbstabholung erst in der verbindlichen Bestaetigung.
 */
function uebersicht(b: BuchungMitPositionen, abholadresse = false) {
  const kaution = b.kaution_zahlart === 'ueberweisung' ? 'per Überweisung vor der Übergabe' : 'bar bei der Übergabe'
  const abholung = b.uebergabe === 'abholung'
  const adresse = `${b.strasse}, ${b.plz} ${b.ort}${b.adresszusatz ? ` (${b.adresszusatz})` : ''}`
  return [
    `Buchungsnummer: ${b.nummer}`,
    `Termin: ${zeitraumText(b)}`,
    abholung ? `Rechnungsadresse: ${adresse}` : `Lieferadresse: ${adresse}`,
    ...(abholung
      ? [`Übergabe: Selbstabholung in ${FIRMA.abholort}${abholadresse ? `, ${FIRMA.strasse}, ${FIRMA.plz} ${FIRMA.ort}` : ''}. Abhol- und Rückgabezeit stimmen wir mit Ihnen ab.`]
      : []),
    '',
    ...b.positionen.map(p => `${p.menge > 1 ? `${p.menge} × ` : ''}${p.name}${p.detail ? ` (${p.detail})` : ''}: ${formatPrice(p.einzelpreis_cent * p.menge)}`),
    abholung
      ? `Selbstabholung: ${formatPrice(0)}`
      : b.entfernung_km === null
        ? 'Lieferung: Fahrtkosten nach Absprache (wir melden uns)'
        : `Lieferung (${String(b.entfernung_km).replace('.', ',')} km): ${formatPrice(b.fahrtkosten_cent)}`,
    `Gesamt: ${formatPrice(b.summe_cent)}${b.entfernung_km === null && !abholung ? ' zzgl. Fahrtkosten' : ''}`,
    `Rückzahlbare Kaution: ${formatPrice(b.kaution_cent)}, ${kaution}`,
  ].join('\n')
}

const signatur = `Freundliche Grüße\n${FIRMA.gruss}\n${FIRMA.name}\n${FIRMA.telefon} · ${FIRMA.email}\n`

export async function bestellMailsSenden(event: H3Event, buchungId: string) {
  let b: BuchungMitPositionen
  try {
    b = await buchungLaden(buchungId)
  }
  catch (err) {
    console.error('[bestellung] Buchung fuer Mails nicht lesbar:', err)
    return
  }
  const { transport, from, to } = useMailer(event)
  const zahlung = b.zahlungsart === 'online' ? (b.bezahlt_am ? 'online, bezahlt' : 'online, noch offen') : 'Überweisung, noch offen'

  // 1. Benachrichtigung an OES. "Antworten" geht direkt an den Kunden.
  try {
    await transport.sendMail({
      from, to,
      replyTo: { name: `${b.vorname} ${b.nachname}`, address: b.email },
      subject: `Neue Bestellung ${b.nummer}: ${b.vorname} ${b.nachname}, ${zeitraumText(b)}`,
      text: `${uebersicht(b)}\n\nZahlung: ${zahlung}\n\n`
        + `${b.vorname} ${b.nachname}\n${b.email}\n${b.telefon}\n\n`
        + (b.bezahlt_am
          ? 'Der Kunde hat die Buchungsbestätigung mit Rechnung automatisch bekommen.\n\n'
          : 'Sobald die Überweisung da ist: in der Verwaltung "Zahlung erhalten" tippen, dann geht die Buchungsbestätigung mit Rechnung raus.\n\n')
        + `Verwaltung: ${getRequestURL(event).origin}/admin/buchungen\n`,
    })
  }
  catch (err) {
    console.error('[bestellung] Mail an OES fehlgeschlagen:', err)
  }

  // 2. An den Kunden: bezahlt = Bestaetigung mit Rechnung, sonst Eingang mit Zahlungsinfos.
  if (b.bezahlt_am) {
    await buchungBestaetigen(event, buchungId).catch(err => console.error('[bestellung] Bestaetigung fehlgeschlagen:', err))
    return
  }
  try {
    await transport.sendMail({
      from, to: b.email, replyTo: from,
      subject: `Ihre Buchungsanfrage ${b.nummer} bei Otto’s Event Service`,
      text: `Guten Tag ${b.vorname} ${b.nachname},\n\n`
        + `vielen Dank für Ihre Buchung. Ihre Bestellung ist bei uns eingegangen.\n\n${uebersicht(b)}\n\n`
        + 'Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto:\n'
        + `Empfänger: ${FIRMA.name}\nBank: ${FIRMA.bank}\nIBAN: ${FIRMA.iban}\n`
        + `Betrag: ${formatPrice(b.summe_cent)}\nVerwendungszweck: ${b.nummer}\n\n`
        + 'Verbindlich wird die Buchung mit unserer Buchungsbestätigung, die Sie nach Eingang der Zahlung '
        + 'zusammen mit der Rechnung per E-Mail erhalten. Bis dahin halten wir den Termin für Sie frei.\n\n'
        + signatur,
    })
  }
  catch (err) {
    console.error('[bestellung] Eingangsbestaetigung an Kunden fehlgeschlagen:', err)
  }
}

/**
 * Buchungsbestaetigung mit Rechnung (PDF) und Mietbedingungen (PDF) an den
 * Kunden, Text nach Louis' Vorlage. Vergibt beim ersten Mal die
 * Rechnungsnummer, setzt die Buchung auf "bestaetigt" und merkt sich den
 * Versand. Erneut aufgerufen (Verwaltung "erneut senden") kommt dieselbe
 * Rechnung mit derselben Nummer.
 */
export async function buchungBestaetigen(event: H3Event, buchungId: string) {
  const db = useSupabase()
  let b = await buchungLaden(buchungId)
  if (!b.bezahlt_am) throw createError({ statusCode: 409, statusMessage: 'Noch nicht bezahlt' })

  const anhaenge: { filename: string, content: Buffer, contentType: string }[] = []
  let ohneRechnung = false
  const { error: rpcFehler } = await db.rpc('rechnung_vergeben', { p_id: buchungId })
  if (rpcFehler) {
    // Ohne Migration 2026-11-04-rechnungen.sql: Bestaetigung trotzdem senden, Rechnung folgt.
    console.error('[bestellung] Rechnungsnummer nicht vergeben:', rpcFehler.message)
    ohneRechnung = true
  }
  else {
    b = await buchungLaden(buchungId)
    const pdf = await rechnungPdf({ ...b, rechnungsnummer: b.rechnungsnummer!, rechnung_am: b.rechnung_am! })
    anhaenge.push({ filename: `OES_Rechnung_${b.rechnungsnummer}.pdf`, content: Buffer.from(pdf), contentType: 'application/pdf' })
  }
  anhaenge.push({ filename: 'OES_Mietbedingungen.pdf', content: Buffer.from(await rechtstextPdf(AGB)), contentType: 'application/pdf' })

  const { transport, from, to } = useMailer(event)
  await transport.sendMail({
    from, to: b.email, replyTo: from,
    bcc: to,   // Louis bekommt eine Kopie fuer seine Unterlagen
    subject: 'Buchungsbestätigung und Rechnung – Otto’s Event Service',
    text: `Guten Tag ${b.vorname} ${b.nachname},\n\n`
      + (ohneRechnung
        ? 'vielen Dank für Ihre Buchung! Hiermit bestätigen wir Ihre Buchung verbindlich. Ihre Rechnung senden wir Ihnen in Kürze separat.\n\n'
        : 'vielen Dank für Ihre Buchung! Hiermit bestätigen wir Ihre Buchung verbindlich. Ihre Rechnung finden Sie als PDF im Anhang.\n\n')
      + `Ihre Buchung im Überblick:\n${uebersicht(b, true)}\n\n`
      + 'Unsere Mietbedingungen, die für diese Buchung gelten, finden Sie ebenfalls als PDF im Anhang.\n'
      + (b.uebergabe === 'abholung'
        ? 'Wegen der Abholzeit melden wir uns rechtzeitig vor Ihrem Termin.\n\n'
        : 'Wegen Lieferung und Aufbau melden wir uns rechtzeitig vor Ihrem Termin.\n\n')
      + signatur,
    attachments: anhaenge,
  })
  const { error } = await db.from('buchungen')
    .update({ status: 'bestaetigt', bestaetigung_gesendet_am: new Date().toISOString() })
    .eq('id', buchungId)
  // Spalte fehlt ohne Migration: dann wenigstens den Status setzen.
  if (error) await db.from('buchungen').update({ status: 'bestaetigt' }).eq('id', buchungId)
  return { ohneRechnung }
}
