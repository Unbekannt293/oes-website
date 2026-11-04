import { z } from 'zod'
import { heuteBerlin } from '~~/shared/preise'
import { fristVon, plusTage } from '~~/shared/zahlungsfrist'

// Daten zu einer Buchung nachtragen. Je Aktion ein Feld, damit Louis auf
// dem Handy mit einem Tipp eine Sache erledigt.
// PATCH /api/admin/buchungen/<id> { aktion, ... }
const schema = z.discriminatedUnion('aktion', [
  z.object({ aktion: z.literal('status'), wert: z.enum(['angefragt', 'bestaetigt', 'storniert']) }),
  z.object({ aktion: z.enum(['bezahlt', 'kaution_erhalten', 'kaution_zurueck']), wert: z.boolean() }),
  z.object({ aktion: z.literal('fahrtkosten'), cent: z.number().int().min(0).max(100_000), km: z.number().min(0).max(500).nullable() }),
  z.object({ aktion: z.literal('notiz'), text: z.string().trim().max(2000) }),
  // Ueberweisung eingegangen: bezahlt setzen und Buchungsbestaetigung mit Rechnung senden.
  z.object({ aktion: z.literal('bestaetigen') }),
  // Bestaetigung (gleiche Rechnung) noch einmal senden.
  z.object({ aktion: z.literal('bestaetigung_senden') }),
  // Zahlungsfrist einer Ueberweisung verlaengern (ab heute bzw. alter Frist).
  z.object({ aktion: z.literal('frist'), tage: z.number().int().min(1).max(30) }),
])

/** Wer wieder aufgenommen wird, bekommt mindestens so viele Tage zum Zahlen. */
const FRIST_NACH_WIEDERAUFNAHME = 3

const SPALTE = { bezahlt: 'bezahlt_am', kaution_erhalten: 'kaution_erhalten_am', kaution_zurueck: 'kaution_zurueck_am' } as const

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const a = await readValidatedBody(event, schema.parse)
  const db = useSupabase()
  // "*": zahlung_bis gibt es erst nach Migration 2026-11-04-zahlungsfrist.sql.
  const { data: b, error } = await db.from('buchungen').select('*').eq('id', id).single()
  if (error || !b) throw createError({ statusCode: 404, statusMessage: 'Buchung nicht gefunden' })

  if (a.aktion === 'bestaetigen' || a.aktion === 'bestaetigung_senden') {
    if (b.status === 'storniert') throw createError({ statusCode: 409, statusMessage: 'Buchung ist storniert' })
    // "bestaetigen" sendet hoechstens einmal: ein Doppeltipp, waehrend die Mail
    // noch rausgeht (STRATO braucht ~20 s), darf keine zweite Bestaetigung
    // ausloesen. Das Datum dient als Sperre, gesetzt bevor die Mail rausgeht.
    if (a.aktion === 'bestaetigen') {
      await db.from('buchungen').update({ bezahlt_am: new Date().toISOString() }).eq('id', id).is('bezahlt_am', null)
      const { data: frei } = await db.from('buchungen')
        .update({ bestaetigung_gesendet_am: new Date().toISOString() })
        .eq('id', id).is('bestaetigung_gesendet_am', null).select('id')
      if (!frei?.length) {
        const { data } = await db.from('buchungen').select('*, positionen(name, detail, menge, einzelpreis_cent)').eq('id', id).single()
        return data
      }
    }
    try {
      await buchungBestaetigen(event, id)
    }
    catch (err) {
      if (a.aktion === 'bestaetigen') await db.from('buchungen').update({ bestaetigung_gesendet_am: null }).eq('id', id)
      console.error('[admin] Bestaetigung fehlgeschlagen:', err)
      throw createError({ statusCode: 502, statusMessage: `Bestätigung nicht gesendet: ${(err as Error).message}` })
    }
    const { data } = await db.from('buchungen').select('*, positionen(name, detail, menge, einzelpreis_cent)').eq('id', id).single()
    return data
  }

  let aenderung: Record<string, unknown>
  if (a.aktion === 'status') {
    // Eine stornierte Buchung wieder aufnehmen nur, wenn die Geraete an
    // allen Tagen noch frei sind. Sonst waere ein Tag doppelt vergeben.
    if (b.status === 'storniert' && a.wert !== 'storniert') await nochFrei(id)
    aenderung = { status: a.wert }
    // Offene Ueberweisung wieder aufgenommen: neue Frist, sonst storniert
    // die taegliche Pruefung sie am naechsten Morgen gleich wieder.
    if (b.status === 'storniert' && a.wert === 'angefragt' && b.zahlungsart === 'ueberweisung' && !b.bezahlt_am) {
      const neu = plusTage(heuteBerlin(), FRIST_NACH_WIEDERAUFNAHME)
      aenderung = { ...aenderung, zahlung_bis: [fristVon(b), neu].sort().at(-1), zahlungserinnerung_am: null }
    }
  }
  else if (a.aktion === 'frist') {
    if (b.zahlungsart !== 'ueberweisung' || b.bezahlt_am) throw createError({ statusCode: 409, statusMessage: 'Nur für offene Überweisungen' })
    const ab = [fristVon(b), heuteBerlin()].sort().at(-1)!
    aenderung = { zahlung_bis: plusTage(ab, a.tage), zahlungserinnerung_am: null }
  }
  else if (a.aktion === 'fahrtkosten') {
    // Gesamtsumme enthaelt die Fahrtkosten: alte raus, neue rein.
    aenderung = {
      fahrtkosten_cent: a.cent,
      entfernung_km: a.km,
      summe_cent: b.summe_cent - b.fahrtkosten_cent + a.cent,
    }
  }
  else if (a.aktion === 'notiz') {
    aenderung = { notiz: a.text || null }
  }
  else {
    aenderung = { [SPALTE[a.aktion]]: a.wert ? new Date().toISOString() : null }
  }

  const { data, error: e2 } = await db.from('buchungen').update(aenderung).eq('id', id)
    .select('*, positionen(name, detail, menge, einzelpreis_cent)').single()
  if (e2) throw createError({ statusCode: 502, statusMessage: e2.message })
  return data
})

async function nochFrei(buchungId: string) {
  const db = useSupabase()
  const { data: bel } = await db.from('belegungen').select('geraet, anzahl, zeitraum').eq('buchung_id', buchungId)
  for (const x of bel ?? []) {
    const { von, bis } = zeitraumLesen(x.zeitraum)
    const { data: tage } = await db.rpc('freie_geraete', { p_geraet: x.geraet, p_von: von, p_bis: bis })
    const knapp = (tage as { tag: string, frei: number }[] | null)?.find(t => t.frei < x.anzahl)
    if (knapp) throw createError({ statusCode: 409, statusMessage: `${x.geraet} am ${knapp.tag} schon vergeben` })
  }
}
