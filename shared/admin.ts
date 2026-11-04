/** Eine Buchung, wie die Verwaltung sie vom Server bekommt (buchungen + positionen). */
export interface AdminBuchungDaten {
  id: string, nummer: string, status: 'angefragt' | 'bestaetigt' | 'storniert', erstellt_am: string
  vorname: string, nachname: string, email: string, telefon: string
  strasse: string, plz: string, ort: string, adresszusatz: string | null
  von: string, bis: string, summe_cent: number, fahrtkosten_cent: number, kaution_cent: number
  kaution_zahlart: 'bar' | 'ueberweisung', entfernung_km: number | null
  zahlungsart: string, bezahlt_am: string | null
  kaution_erhalten_am: string | null, kaution_zurueck_am: string | null, notiz: string | null
  /** Nach Migration 2026-11-04-rechnungen.sql, vorher undefined. */
  rechnungsnummer?: string | null, bestaetigung_gesendet_am?: string | null
  /** Nach Migration 2026-11-04-abholung.sql. */
  uebergabe?: 'lieferung' | 'abholung'
  positionen: { name: string, detail: string | null, menge: number, einzelpreis_cent: number }[]
}

