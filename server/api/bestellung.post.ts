import { z } from 'zod'
import { bestellungSchema } from '~~/shared/schemas'
import { quoteDelivery } from '~~/shared/pricing'
import { heuteBerlin } from '~~/shared/preise'
import { zahlungsfrist } from '~~/shared/zahlungsfrist'
import { findPackage, LAYOUT_ADDON } from '~~/shared/catalog'

// Bestellung aus der Kasse:
// 1. Auswahl pruefen, Preise und Kaution auf dem Server neu rechnen,
// 2. Strecke zur Adresse neu berechnen (nicht die aus dem Browser nehmen),
// 3. in einem Datenbankschritt pruefen und speichern (buchung_anlegen,
//    bricht ab, wenn ein Geraet an einem Tag nicht mehr frei ist),
// 4. Ueberweisung: Mails an OES und an den Kunden.
//    Online: Bezahlseite bei Stripe, Mails erst nach der Zahlung
//    (server/utils/stripe.ts).
export default defineEventHandler(async (event) => {
  bremse(event, 'bestellung', 10, STUNDE)
  const parsed = bestellungSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validierung fehlgeschlagen', data: { fields: z.flattenError(parsed.error).fieldErrors } })
  }
  const b = parsed.data
  if (b.zahlungsart === 'online' && !useRuntimeConfig(event).public.onlinePayment) {
    throw createError({ statusCode: 503, statusMessage: 'Online-Zahlung ist noch nicht eingerichtet' })
  }

  const korb = korbBerechnen(b.zeilen)
  // Fotolayouts: Pflicht, wenn ein eigenes Layout gebucht oder im Paket
  // enthalten ist, sonst bleiben Auswahl und Logo unbeachtet.
  const mitLayout = b.zeilen.some(z => (z.kind === 'addon' && z.slug === LAYOUT_ADDON)
    || (z.kind === 'package' && !!findPackage(z.slug)?.designIncluded))
  if (mitLayout && !b.layouts.length) {
    throw createError({ statusCode: 422, statusMessage: 'Validierung fehlgeschlagen', data: { fields: { layouts: ['Bitte mindestens ein Layout wählen'] } } })
  }
  const layouts = mitLayout ? b.layouts : []
  const firma = b.kundenart === 'firma' ? b.firma : undefined
  // Selbstabholung nur, wenn keine Fotobox dabei ist (die liefert OES immer).
  const abholung = b.uebergabe === 'abholung'
  if (abholung && korb.belegungen.some(x => x.geraet === 'fotobox')) {
    throw createError({ statusCode: 422, statusMessage: 'Die Fotobox liefern wir immer, Selbstabholung gibt es nur für Soundboxen' })
  }
  // Entfernungsdienst weg: trotzdem bestellen lassen, Fahrtkosten klaert
  // Louis danach (steht in der Notiz und in den Mails). Bei Abholung keine Fahrt.
  const strecke = abholung ? null : await streckeOderOffen(event, b.adresse)
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
      kaution_zahlart: b.kaution,
      entfernung_km: strecke?.distanceKm ?? null,
      notiz: strecke || abholung ? null : 'Fahrtkosten offen: Entfernungsdienst war nicht erreichbar, bitte nachberechnen',
      uebergabe: b.uebergabe,
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

  // Angaben von der Kasse (Migration 2026-11-11-kasse.sql). Getrennt vom
  // Anlegen, damit buchung_anlegen nicht schon wieder geaendert werden muss.
  const logoPfad = mitLayout && b.logo ? await logoSpeichern(id, b.logo) : null
  const { error: angabenFehler } = await useSupabase().from('buchungen').update({
    kundenart: b.kundenart,
    firma: firma?.name ?? null,
    ust_id: firma?.ustId || null,
    anlass: b.veranstaltung.anlass,
    anlass_text: b.veranstaltung.anlass === 'sonstiges' ? b.veranstaltung.anlassText : null,
    layouts,
    logo_pfad: logoPfad,
    widerruf_zustimmung_am: b.kundenart === 'privat' && b.widerrufZustimmung ? new Date().toISOString() : null,
  }).eq('id', id)
  if (angabenFehler) console.error('[bestellung] Angaben nicht gespeichert:', angabenFehler.message)

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

  // Ueberweisung: Zahlungsfrist merken (steht in der Mail, die taegliche
  // Pruefung erinnert und storniert danach). Ohne Migration rechnet der
  // Server die Frist bei Bedarf aus Bestelldatum und Termin.
  const frist = zahlungsfrist(heuteBerlin(), korb.von)
  const { error: fristFehler } = await useSupabase().from('buchungen').update({ zahlung_bis: frist }).eq('id', id)
  if (fristFehler) console.error('[bestellung] Zahlungsfrist nicht gespeichert:', fristFehler.message)

  await bestellMailsSenden(event, id)
  return { nummer, zahlungBis: frist }
})
