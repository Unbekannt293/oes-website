import type { PDFPage } from 'pdf-lib'
import { FIRMA } from '~~/shared/firma'
import { formatPrice } from '~~/shared/pricing'
import { A4, Blatt, FARBE, type Schriften, sicher } from './pdf'

/**
 * Rechnung als PDF, im Aufbau von Louis' Beispielrechnung
 * (OES_Beispielrechnung_285735_online_bezahlt.pdf): Absenderzeile,
 * Empfaenger links, Rechnungsdaten rechts, Positionen, Kaution separat,
 * Kleinunternehmer-Hinweis, Zahlungsbestaetigung, Fusszeile mit Bank.
 * Alle Betraege kommen aus der Datenbank, nichts wird hier neu gerechnet
 * ausser der Summe der Positionen fuer die Anzeige.
 */
export interface RechnungsDaten {
  nummer: string
  rechnungsnummer: string
  rechnung_am: string
  vorname: string, nachname: string
  strasse: string, plz: string, ort: string, adresszusatz: string | null
  von: string, bis: string
  positionen: { name: string, detail: string | null, menge: number, einzelpreis_cent: number }[]
  fahrtkosten_cent: number, entfernung_km: number | null
  summe_cent: number, kaution_cent: number, kaution_zahlart?: 'bar' | 'ueberweisung'
  zahlungsart: string, bezahlt_am: string | null
  uebergabe?: 'lieferung' | 'abholung'
}

const datum = (iso: string) => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' })
  .format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso))

export async function rechnungPdf(r: RechnungsDaten): Promise<Uint8Array> {
  const fuss = (seite: PDFPage, s: Schriften) => {
    const y0 = 58
    seite.drawLine({ start: { x: 56, y: y0 + 12 }, end: { x: A4.w - 56, y: y0 + 12 }, thickness: 0.6, color: FARBE.linie })
    const zeilen = [
      `${FIRMA.name} · Inhaber: ${FIRMA.inhaber} · ${FIRMA.strasse} · ${FIRMA.plz} ${FIRMA.ort}`,
      `Telefon ${FIRMA.telefon} · ${FIRMA.email}`,
      `Bankverbindung: ${FIRMA.bank} · IBAN: ${FIRMA.iban}`,
    ]
    zeilen.forEach((z, i) => seite.drawText(sicher(z), { x: 56, y: y0 - i * 11, size: 8, font: s.normal, color: FARBE.grau }))
  }
  const b = await Blatt.neu({ l: 56, r: 56, o: 44, u: 92 }, fuss)
  const rechtsX = 330
  const bezahlt = !!r.bezahlt_am
  const online = r.zahlungsart === 'online'

  // ---- Kopf ----
  b.text(`${FIRMA.name} · Inhaber: ${FIRMA.inhaber} · ${FIRMA.strasse} · ${FIRMA.plz} ${FIRMA.ort}`, { groesse: 8, farbe: FARBE.grau })
  b.abstand(18)
  const oben = b.y
  b.text('Empfänger:', { groesse: 9, farbe: FARBE.grau, zeilenabstand: 13 })
  for (const z of [`${r.vorname} ${r.nachname}`, r.strasse, r.adresszusatz, `${r.plz} ${r.ort}`].filter(Boolean) as string[]) {
    b.text(z, { groesse: 10, zeilenabstand: 14, breite: 240 })
  }
  const linksUnten = b.y
  const zeitraum = r.von === r.bis ? datum(r.von) : `${datum(r.von)} - ${datum(r.bis)}`
  const info: [string, string][] = [
    ['Rechnungsnummer', r.rechnungsnummer],
    ['Rechnungsdatum', datum(r.rechnung_am)],
    ['Leistungszeitraum', zeitraum],
    ['Buchungsnummer', r.nummer],
    ['Website', FIRMA.web],
    ['Ansprechpartner', FIRMA.inhaber],
    ['E-Mail', FIRMA.email],
    ['Telefon', FIRMA.telefon],
  ]
  info.forEach(([k, v], i) => {
    const y = oben - 10 - i * 15
    b.an(`${k}:`, rechtsX, y, { groesse: 9, farbe: FARBE.grau })
    b.an(v, rechtsX + 92, y, { groesse: 9 })
  })
  b.y = Math.min(linksUnten, oben - info.length * 15) - 24

  // ---- Titel ----
  b.an('Rechnung', b.rand.l, b.y - 14, { groesse: 16, schrift: b.s.fett })
  const status = bezahlt ? (online ? 'ONLINE BEZAHLT' : 'BEZAHLT PER ÜBERWEISUNG') : 'ZAHLUNG OFFEN'
  b.an(status, 0, b.y - 12, { groesse: 8, farbe: FARBE.grau, rechtsBis: A4.w - b.rand.r })
  b.abstand(26)
  b.text(bezahlt
    ? 'Vielen Dank für Ihre Buchung. Die Zahlung des Mietpreises haben wir bereits erhalten.'
    : 'Vielen Dank für Ihre Buchung. Bitte überweisen Sie den Rechnungsbetrag auf das unten genannte Konto.', { groesse: 10 })
  b.abstand(8)

  // ---- Tabelle ----
  const sp = { name: b.rand.l + 8, menge: 330, einzel: 470, gesamt: A4.w - b.rand.r - 8 }
  const zeile = (links: string, menge = '', einzel = '', gesamt = '', o: { fett?: boolean, flaeche?: boolean, detail?: string | null } = {}) => {
    const schrift = o.fett ? b.s.fett : b.s.normal
    const nameZeilen = b.zeilen(links, schrift, 9.5, sp.menge - sp.name - 12)
    const h = 8 + nameZeilen.length * 12 + (o.detail ? 11 : 0)
    b.platz(h)
    if (o.flaeche) b.seite.drawRectangle({ x: b.rand.l, y: b.y - h, width: b.breite, height: h, color: FARBE.flaeche })
    nameZeilen.forEach((z, i) => b.an(z, sp.name, b.y - 14 - i * 12, { groesse: 9.5, schrift }))
    if (o.detail) b.an(o.detail, sp.name, b.y - 14 - nameZeilen.length * 12, { groesse: 8, farbe: FARBE.grau })
    if (menge) b.an(menge, sp.menge, b.y - 14, { groesse: 9.5 })
    if (einzel) b.an(einzel, 0, b.y - 14, { groesse: 9.5, rechtsBis: sp.einzel })
    if (gesamt) b.an(gesamt, 0, b.y - 14, { groesse: 9.5, schrift, rechtsBis: sp.gesamt })
    b.y -= h
    b.linie(b.y)
  }
  // Kopfzeile
  b.platz(30)
  b.seite.drawRectangle({ x: b.rand.l, y: b.y - 30, width: b.breite, height: 30, color: FARBE.flaeche })
  b.an('Bezeichnung', sp.name, b.y - 13, { groesse: 9, schrift: b.s.fett })
  b.an('Artikel / Dienstleistung', sp.name, b.y - 24, { groesse: 9, schrift: b.s.fett })
  b.an('Menge', sp.menge, b.y - 13, { groesse: 9, schrift: b.s.fett })
  b.an('Einzelpreis', 0, b.y - 13, { groesse: 9, schrift: b.s.fett, rechtsBis: sp.einzel })
  b.an('Gesamtpreis', 0, b.y - 13, { groesse: 9, schrift: b.s.fett, rechtsBis: sp.gesamt })
  b.an('in EUR', 0, b.y - 24, { groesse: 9, schrift: b.s.fett, rechtsBis: sp.gesamt })
  b.y -= 30
  b.linie(b.y)

  for (const p of r.positionen) {
    zeile(p.name, String(p.menge), formatPrice(p.einzelpreis_cent), formatPrice(p.einzelpreis_cent * p.menge), { detail: p.detail })
  }
  const km = r.entfernung_km === null ? null : String(r.entfernung_km).replace('.', ',')
  if (r.uebergabe === 'abholung') zeile(`Selbstabholung in ${FIRMA.abholort}`, '', '', formatPrice(0))
  else zeile(km === null ? 'Lieferung, Auf- und Abbau (Fahrtkosten nach Absprache)' : `Lieferung, Auf- und Abbau (${km} km)`, '', '', formatPrice(r.fahrtkosten_cent))
  zeile('Rechnungsbetrag', '', '', formatPrice(r.summe_cent), { fett: true })
  if (bezahlt) zeile(online ? 'Bereits online bezahlt' : 'Bereits per Überweisung bezahlt', '', '', `-${formatPrice(r.summe_cent)}`)
  zeile('Rückzahlbare Kaution (separat zu zahlen)', '', '', formatPrice(r.kaution_cent))
  zeile(`Veranstaltung: ${zeitraum}`)
  zeile('Offener Rechnungsbetrag', '', '', formatPrice(bezahlt ? 0 : r.summe_cent), { fett: true, flaeche: true })
  b.abstand(14)

  // ---- Hinweise ----
  const kaution = formatPrice(r.kaution_cent)
  const kautionWie = r.kaution_zahlart === 'ueberweisung'
    ? 'Sie ist vor der Übergabe per Überweisung zu zahlen'
    : 'Sie wird bei der Übergabe in bar hinterlegt'
  b.text('Hinweis zur Kaution:', { groesse: 9.5, schrift: b.s.fett })
  b.text(`Zusätzlich zum Mietpreis wird eine rückzahlbare Kaution in Höhe von ${kaution} erhoben. Diese dient als Sicherheitsleistung und ist nicht Bestandteil des Mietpreises. ${kautionWie} und ist mit dem Rechnungsbetrag nicht beglichen. Nach ordnungsgemäßer Rückgabe und Überprüfung der Mietgegenstände wird die Kaution zurückerstattet, soweit keine berechtigten Forderungen bestehen.`, { groesse: 9.5 })
  b.text(FIRMA.steuerhinweis, { groesse: 9.5, schrift: b.s.kursiv, farbe: FARBE.grau })
  b.abstand(12)

  if (bezahlt) {
    b.text('Zahlungsbestätigung:', { groesse: 9.5, schrift: b.s.fett })
    b.text(`Der Rechnungsbetrag von ${formatPrice(r.summe_cent)} wurde am ${datum(r.bezahlt_am!)} vollständig ${online ? 'online über unsere Website' : 'per Überweisung'} bezahlt.`, { groesse: 9.5 })
    b.text(`Zahlungsart: ${online ? `Online-Zahlung über ${FIRMA.web}` : 'Banküberweisung'}`, { groesse: 9.5 })
    b.text('Zahlungsstatus: Mietpreis vollständig bezahlt', { groesse: 9.5 })
    b.text('Für den Mietpreis ist keine weitere Zahlung erforderlich.', { groesse: 9.5 })
  }
  else {
    b.text('Zahlungsinformationen:', { groesse: 9.5, schrift: b.s.fett })
    b.text(`Bitte überweisen Sie ${formatPrice(r.summe_cent)} an ${FIRMA.name}, ${FIRMA.bank}, IBAN ${FIRMA.iban}.`, { groesse: 9.5 })
    b.text(`Verwendungszweck: ${r.nummer}`, { groesse: 9.5 })
  }
  b.abstand(14)
  b.text('Freundliche Grüße', { groesse: 10 })
  b.text(FIRMA.gruss, { groesse: 10, schrift: b.s.fett })
  return b.bytes()
}
