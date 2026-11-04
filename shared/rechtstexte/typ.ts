/** Ein Rechtstext in Abschnitten, fuer Seite und PDF. */
export interface Rechtstext {
  titel: string
  stand: string
  abschnitte: {
    titel: string
    absaetze: string[]
    /** Tabelle, eingefuegt nach dem Absatz mit diesem Index (tabelleNach Absaetze davor). */
    tabelle?: { kopf: [string, string], zeilen: [string, string][] }
    tabelleNach?: number
  }[]
}
