// GET /api/admin/buchungen/export: alle Buchungen (auch stornierte) als CSV,
// zum Sichern fuer Louis (z. B. einmal im Monat). Semikolon und deutsche
// Kommazahlen, mit BOM, damit Excel und Numbers Umlaute und Spalten richtig
// erkennen. Enthaelt auch, was nur in der Datenbank steht (bezahlt, Kaution,
// Notiz), die Mails haben das nicht.
import { ANLAESSE, type Anlass, layoutName } from '~~/shared/buchung'

export default defineEventHandler(async (event) => {
  const { data, error } = await useSupabase()
    .from('buchungen').select('*, positionen(name, detail, menge, einzelpreis_cent)')
    .order('erstellt_am', { ascending: true })
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })

  const euro = (c: number | null | undefined) => c == null ? '' : (c / 100).toFixed(2).replace('.', ',')
  const datum = (iso: string | null | undefined) => iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }) : ''
  const feld = (v: unknown) => {
    const t = v == null ? '' : String(v)
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }

  const kopf = ['Buchungsnummer', 'Status', 'Bestellt am', 'Von', 'Bis', 'Kundenart', 'Firma', 'USt-IdNr.', 'Anlass', 'Vorname', 'Nachname', 'E-Mail', 'Telefon',
    'Straße', 'PLZ', 'Ort', 'Adresszusatz', 'Übergabe', 'Positionen', 'Entfernung km', 'Fahrtkosten EUR', 'Gesamt EUR',
    'Kaution EUR', 'Kaution Zahlart', 'Zahlungsart', 'Bezahlt am', 'Kaution erhalten am', 'Kaution zurück am',
    'Rechnungsnummer', 'Rechnungsdatum', 'Bestätigung gesendet am', 'Fotolayouts', 'Logo', 'Widerruf-Zustimmung am', 'Notiz']
  const zeilen = (data ?? []).map(b => [
    b.nummer, b.status, datum(b.erstellt_am), datum(b.von), datum(b.bis),
    b.kundenart ?? 'privat', b.firma, b.ust_id,
    b.anlass === 'sonstiges' ? b.anlass_text : (b.anlass ? ANLAESSE[b.anlass as Anlass] ?? b.anlass : ''),
    b.vorname, b.nachname, b.email, b.telefon,
    b.strasse, b.plz, b.ort, b.adresszusatz, b.uebergabe ?? 'lieferung',
    (b.positionen ?? []).map((p: { name: string, detail: string | null, menge: number, einzelpreis_cent: number }) =>
      `${p.menge > 1 ? `${p.menge} x ` : ''}${p.name}${p.detail ? ` (${p.detail})` : ''} ${euro(p.einzelpreis_cent * p.menge)}`).join(' | '),
    b.entfernung_km == null ? '' : String(b.entfernung_km).replace('.', ','), euro(b.fahrtkosten_cent), euro(b.summe_cent),
    euro(b.kaution_cent), b.kaution_zahlart, b.zahlungsart, datum(b.bezahlt_am), datum(b.kaution_erhalten_am), datum(b.kaution_zurueck_am),
    b.rechnungsnummer, datum(b.rechnung_am), datum(b.bestaetigung_gesendet_am),
    (b.layouts ?? []).map(layoutName).join(', '), b.logo_pfad ? 'ja' : '', datum(b.widerruf_zustimmung_am), b.notiz,
  ].map(feld).join(';'))

  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="OES_Buchungen_${heute}.csv"`,
    'Cache-Control': 'no-store',
  })
  return `﻿${[kopf.map(feld).join(';'), ...zeilen].join('\r\n')}\r\n`
})
