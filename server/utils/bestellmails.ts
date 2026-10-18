import type { H3Event } from 'h3'
import { formatPrice } from '~~/shared/pricing'

/**
 * Mails zu einer Bestellung: an OES (Antworten gehen an den Kunden) und an
 * den Kunden. Liest alles aus der Datenbank, damit Ueberweisung (sofort nach
 * dem Bestellen) und Online-Zahlung (erst wenn Stripe die Zahlung meldet)
 * dieselben Mails bekommen. Scheitert der Versand, wird das nur
 * protokolliert: die Bestellung ist gespeichert, Louis sieht sie dort.
 */
interface BuchungMitPositionen {
  nummer: string, vorname: string, nachname: string, email: string, telefon: string
  strasse: string, plz: string, ort: string, adresszusatz: string | null
  von: string, bis: string, summe_cent: number, fahrtkosten_cent: number, kaution_cent: number
  entfernung_km: number | null, zahlungsart: string, bezahlt_am: string | null
  positionen: { name: string, detail: string | null, menge: number, einzelpreis_cent: number }[]
}

const tag = (iso: string) => new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
  .format(new Date(`${iso}T12:00:00`))

export async function bestellMailsSenden(event: H3Event, buchungId: string) {
  try {
    const { data, error } = await useSupabase()
      .from('buchungen')
      .select('nummer, vorname, nachname, email, telefon, strasse, plz, ort, adresszusatz, von, bis, summe_cent, fahrtkosten_cent, kaution_cent, entfernung_km, zahlungsart, bezahlt_am, positionen(name, detail, menge, einzelpreis_cent)')
      .eq('id', buchungId)
      .single<BuchungMitPositionen>()
    if (error || !data) throw new Error(error?.message ?? 'Buchung nicht gefunden')
    const b = data

    const { transport, from, to } = useMailer(event)
    const zeitraum = b.von === b.bis ? tag(b.von) : `${tag(b.von)} bis ${tag(b.bis)}`
    const uebersicht = [
      ...b.positionen.map(p => `${p.menge > 1 ? `${p.menge} × ` : ''}${p.name}${p.detail ? ` (${p.detail})` : ''}: ${formatPrice(p.einzelpreis_cent * p.menge)}`),
      b.entfernung_km === null
        ? 'Fahrtkosten: nach Absprache (wir melden uns)'
        : `Fahrtkosten (${String(b.entfernung_km).replace('.', ',')} km): ${formatPrice(b.fahrtkosten_cent)}`,
      `Gesamt: ${formatPrice(b.summe_cent)}${b.entfernung_km === null ? ' zzgl. Fahrtkosten' : ''}`,
      `Kaution: ${formatPrice(b.kaution_cent)}`,
    ].join('\n')
    const zahlung = b.zahlungsart === 'online'
      ? (b.bezahlt_am ? 'online, bezahlt' : 'online, noch offen')
      : 'Überweisung'

    await transport.sendMail({
      from, to,
      replyTo: { name: `${b.vorname} ${b.nachname}`, address: b.email },
      subject: `Neue Bestellung ${b.nummer}: ${b.vorname} ${b.nachname}, ${zeitraum}`,
      text: `${uebersicht}\n\nZahlung: ${zahlung}\n\n`
        + `${b.vorname} ${b.nachname}\n${b.email}\n${b.telefon}\n\n`
        + `${b.strasse}\n${b.plz} ${b.ort}\n${b.adresszusatz ?? ''}\n`,
    })
    await transport.sendMail({
      from, to: b.email, replyTo: from,
      subject: `Ihre Bestellung ${b.nummer} bei Otto's Event Service`,
      text: `Hallo ${b.vorname},\n\nvielen Dank für Ihre Bestellung (${b.nummer}) für ${zeitraum}.\n\n${uebersicht}\n\n`
        + (b.bezahlt_am ? 'Ihre Zahlung ist bei uns eingegangen.\n\n' : '')
        + 'Rechnung und Mietvertrag erhalten Sie in Kürze in einer weiteren E-Mail.\n\n'
        + 'Viele Grüße\nLouis Otto\nOtto\'s Event Service\n',
    })
  }
  catch (err) {
    console.error('[bestellung] Mailversand fehlgeschlagen:', err)
  }
}
