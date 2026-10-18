import { z } from 'zod'
import { bestellungSchema } from '~~/shared/schemas'
import { formatPrice, quoteDelivery } from '~~/shared/pricing'

// Bestellung aus der Kasse:
// 1. Auswahl pruefen, Preise und Kaution auf dem Server neu rechnen,
// 2. Strecke zur Adresse neu berechnen (nicht die aus dem Browser nehmen),
// 3. in einem Datenbankschritt pruefen und speichern (buchung_anlegen,
//    bricht ab, wenn ein Geraet an einem Tag nicht mehr frei ist),
// 4. Mails an OES und an den Kunden.
// Online-Zahlung (Stripe) haengt hier spaeter an Schritt 3 an.
export default defineEventHandler(async (event) => {
  const parsed = bestellungSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validierung fehlgeschlagen', data: { fields: z.flattenError(parsed.error).fieldErrors } })
  }
  const b = parsed.data
  if (b.zahlungsart === 'online' && !useRuntimeConfig(event).public.onlinePayment) {
    throw createError({ statusCode: 503, statusMessage: 'Online-Zahlung ist noch nicht eingerichtet' })
  }

  const korb = korbBerechnen(b.zeilen)
  const strecke = await streckeZu(event, b.adresse)
  const lieferung = quoteDelivery(strecke.distanceKm, korb.lines)

  const { data, error } = await useSupabase().rpc('buchung_anlegen', {
    p_buchung: {
      ...b.kontakt,
      strasse: b.adresse.strasse, plz: b.adresse.plz, ort: b.adresse.ort, adresszusatz: b.adresse.zusatz || null,
      von: korb.von, bis: korb.bis,
      summe_cent: korb.summeCent + lieferung.feeCents,
      fahrtkosten_cent: lieferung.feeCents,
      kaution_cent: korb.kautionCent,
      entfernung_km: strecke.distanceKm,
      zahlungsart: b.zahlungsart,
    },
    p_positionen: korb.positionen,
    p_belegungen: korb.belegungen,
  })
  if (error) {
    // "nicht_verfuegbar:soundbox:2026-12-12" aus buchung_anlegen
    const knapp = error.message.match(/nicht_verfuegbar:(\w+):(\d{4}-\d{2}-\d{2})/)
    if (knapp) {
      throw createError({ statusCode: 409, statusMessage: 'Nicht mehr verfügbar', data: { geraet: knapp[1], tag: knapp[2] } })
    }
    console.error('[bestellung] Datenbank:', error.message)
    throw createError({ statusCode: 502, statusMessage: 'Bestellung konnte gerade nicht gespeichert werden' })
  }
  const nummer = (data as { id: string, nummer: string }[])[0]!.nummer

  // Mails. Scheitern sie, ist die Buchung trotzdem gespeichert: dann nur
  // protokollieren, Louis sieht sie in der Datenbank.
  try {
    const { transport, from, to } = useMailer(event)
    const gesamt = korb.summeCent + lieferung.feeCents
    const zeilenText = korb.positionen
      .map(p => `${p.menge > 1 ? `${p.menge} × ` : ''}${p.name}${p.detail ? ` (${p.detail})` : ''}: ${formatPrice(p.einzelpreis_cent * p.menge)}`)
      .join('\n')
    const tage = korb.von === korb.bis ? formatTag(korb.von) : `${formatTag(korb.von)} bis ${formatTag(korb.bis)}`
    const uebersicht = [
      zeilenText,
      `Fahrtkosten (${strecke.distanceKm} km): ${formatPrice(lieferung.feeCents)}`,
      `Gesamt: ${formatPrice(gesamt)}`,
      `Kaution: ${formatPrice(korb.kautionCent)}`,
    ].join('\n')
    const k = b.kontakt
    await transport.sendMail({
      from, to,
      replyTo: { name: `${k.vorname} ${k.nachname}`, address: k.email },
      subject: `Neue Bestellung ${nummer}: ${k.vorname} ${k.nachname}, ${tage}`,
      text: `${uebersicht}\n\nZahlungsart: ${b.zahlungsart === 'online' ? 'online' : 'Überweisung'}\n\n`
        + `${k.vorname} ${k.nachname}\n${k.email}\n${k.telefon}\n\n`
        + `${b.adresse.strasse}\n${b.adresse.plz} ${b.adresse.ort}\n${b.adresse.zusatz ?? ''}\n`
        + `(${strecke.label}, ${strecke.distanceKm} km)\n`,
    })
    await transport.sendMail({
      from, to: k.email, replyTo: from,
      subject: `Ihre Bestellung ${nummer} bei Otto's Event Service`,
      text: `Hallo ${k.vorname},\n\nvielen Dank für Ihre Bestellung (${nummer}) für ${tage}.\n\n${uebersicht}\n\n`
        + 'Rechnung und Mietvertrag erhalten Sie in Kürze in einer weiteren E-Mail.\n\n'
        + 'Viele Grüße\nLouis Otto\nOtto\'s Event Service\n',
    })
  }
  catch (err) {
    console.error('[bestellung] Mailversand fehlgeschlagen:', err)
  }

  return { nummer }
})

function formatTag(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${iso}T12:00:00`))
}
