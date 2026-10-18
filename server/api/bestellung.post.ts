import { z } from 'zod'
import { bestellungSchema } from '~~/shared/schemas'
import { quoteDelivery } from '~~/shared/pricing'

// Bestellung aus der Kasse:
// 1. Auswahl pruefen, Preise und Kaution auf dem Server neu rechnen,
// 2. Strecke zur Adresse neu berechnen (nicht die aus dem Browser nehmen),
// 3. in einem Datenbankschritt pruefen und speichern (buchung_anlegen,
//    bricht ab, wenn ein Geraet an einem Tag nicht mehr frei ist),
// 4. Ueberweisung: Mails an OES und an den Kunden.
//    Online: Bezahlseite bei Stripe, Mails erst nach der Zahlung
//    (server/utils/stripe.ts).
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
  // Entfernungsdienst weg: trotzdem bestellen lassen, Fahrtkosten klaert
  // Louis danach (steht in der Notiz und in den Mails).
  const strecke = await streckeOderOffen(event, b.adresse)
  const lieferung = strecke
    ? quoteDelivery(strecke.distanceKm, korb.lines)
    : { distanceKm: 0, freeKm: 0, billableKm: 0, feeCents: 0 }

  const { data, error } = await useSupabase().rpc('buchung_anlegen', {
    p_buchung: {
      ...b.kontakt,
      strasse: b.adresse.strasse, plz: b.adresse.plz, ort: b.adresse.ort, adresszusatz: b.adresse.zusatz || null,
      von: korb.von, bis: korb.bis,
      summe_cent: korb.summeCent + lieferung.feeCents,
      fahrtkosten_cent: lieferung.feeCents,
      kaution_cent: korb.kautionCent,
      entfernung_km: strecke?.distanceKm ?? null,
      notiz: strecke ? null : 'Fahrtkosten offen: Entfernungsdienst war nicht erreichbar, bitte nachberechnen',
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
  const { id, nummer } = (data as { id: string, nummer: string }[])[0]!

  if (b.zahlungsart === 'online') {
    try {
      const url = await zahlungStarten(event, {
        buchungId: id, nummer, email: b.kontakt.email,
        positionen: korb.positionen, fahrtkostenCent: lieferung.feeCents,
      })
      return { nummer, url }
    }
    catch (err) {
      // Ohne Bezahlseite soll die Reservierung nicht haengen bleiben.
      await zahlungVerwerfen(id)
      console.error('[bestellung] Stripe:', err)
      throw createError({ statusCode: 502, statusMessage: 'Online-Zahlung gerade nicht möglich' })
    }
  }

  await bestellMailsSenden(event, id)
  return { nummer }
})
