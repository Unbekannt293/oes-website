import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from 'pdf-lib'

/*
 * Kleiner Satz-Helfer fuer PDFs (Rechnung, Mietbedingungen) auf pdf-lib.
 * pdf-lib bringt die Standardschriften im Code mit, braucht also keine
 * Schriftdateien und laeuft so auch in Netlify-Funktionen.
 *
 * Die Standardschriften kennen nur den Zeichensatz Windows-1252 (Umlaute,
 * €, „“, –, · sind dabei). Alles andere, etwa ein Emoji im Kundennamen,
 * wuerde pdf-lib abbrechen lassen, deshalb geht jeder Text durch sicher().
 */
export const A4 = { w: 595.28, h: 841.89 }
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'
const ERSATZ: Record<string, string> = { '→': '->', '≥': '>=', '≤': '<=', '×': 'x', ' ': ' ', ' ': ' ', ' ': ' ' }

export function sicher(text: string) {
  return [...text].map((c) => {
    if (ERSATZ[c] !== undefined) return ERSATZ[c]
    const n = c.codePointAt(0)!
    if ((n >= 0x20 && n <= 0x7E) || (n >= 0xA0 && n <= 0xFF) || CP1252_EXTRA.includes(c)) return c
    return ''
  }).join('')
}

export const FARBE = {
  text: rgb(0.09, 0.09, 0.1),
  grau: rgb(0.42, 0.4, 0.38),
  linie: rgb(0.85, 0.83, 0.8),
  flaeche: rgb(0.95, 0.95, 0.95),
}

export interface Schriften { normal: PDFFont, fett: PDFFont, kursiv: PDFFont }

interface TextOpt { groesse?: number, schrift?: PDFFont, x?: number, breite?: number, farbe?: ReturnType<typeof rgb>, zeilenabstand?: number, rechts?: boolean }

/**
 * Ein Dokument mit "Schreibkopf": y laeuft von oben nach unten, text()
 * bricht um und beginnt eine neue Seite, wenn unten kein Platz mehr ist.
 */
export class Blatt {
  seite!: PDFPage
  y = 0
  private constructor(
    public doc: PDFDocument,
    public s: Schriften,
    public rand: { l: number, r: number, o: number, u: number },
    private fuss?: (seite: PDFPage, s: Schriften) => void,
  ) {}

  static async neu(rand = { l: 56, r: 56, o: 52, u: 80 }, fuss?: (seite: PDFPage, s: Schriften) => void) {
    const doc = await PDFDocument.create()
    const s = {
      normal: await doc.embedFont(StandardFonts.Helvetica),
      fett: await doc.embedFont(StandardFonts.HelveticaBold),
      kursiv: await doc.embedFont(StandardFonts.HelveticaOblique),
    }
    const b = new Blatt(doc, s, rand, fuss)
    b.neueSeite()
    return b
  }

  get breite() { return A4.w - this.rand.l - this.rand.r }

  neueSeite() {
    this.seite = this.doc.addPage([A4.w, A4.h])
    this.y = A4.h - this.rand.o
    this.fuss?.(this.seite, this.s)
  }

  /** Platz fuer h Punkte sicherstellen, sonst neue Seite. */
  platz(h: number) {
    if (this.y - h < this.rand.u) this.neueSeite()
  }

  zeilen(text: string, schrift: PDFFont, groesse: number, breite: number) {
    const out: string[] = []
    // Erst an Umbruechen trennen, dann bereinigen: sicher() entfernt "\n".
    for (const absatz of text.split('\n').map(sicher)) {
      let zeile = ''
      for (const wort of absatz.split(/\s+/).filter(Boolean)) {
        const probe = zeile ? `${zeile} ${wort}` : wort
        if (schrift.widthOfTextAtSize(probe, groesse) <= breite || !zeile) zeile = probe
        else { out.push(zeile); zeile = wort }
      }
      out.push(zeile)
    }
    return out
  }

  /** Text an der aktuellen Hoehe, umgebrochen. Gibt die verbrauchte Hoehe zurueck. */
  text(text: string, o: TextOpt = {}) {
    const groesse = o.groesse ?? 10
    const schrift = o.schrift ?? this.s.normal
    const x = o.x ?? this.rand.l
    const breite = o.breite ?? this.breite - (x - this.rand.l)
    const za = o.zeilenabstand ?? groesse * 1.4
    const zeilen = this.zeilen(text, schrift, groesse, breite)
    for (const z of zeilen) {
      this.platz(za)
      const w = schrift.widthOfTextAtSize(z, groesse)
      this.seite.drawText(z, { x: o.rechts ? x + breite - w : x, y: this.y - groesse, size: groesse, font: schrift, color: o.farbe ?? FARBE.text })
      this.y -= za
    }
    return zeilen.length * za
  }

  /** Einzeilig an fester Stelle, ohne den Schreibkopf zu bewegen. */
  an(text: string, x: number, y: number, o: { groesse?: number, schrift?: PDFFont, farbe?: ReturnType<typeof rgb>, rechtsBis?: number } = {}) {
    const groesse = o.groesse ?? 10
    const schrift = o.schrift ?? this.s.normal
    const t = sicher(text)
    const xx = o.rechtsBis !== undefined ? o.rechtsBis - schrift.widthOfTextAtSize(t, groesse) : x
    this.seite.drawText(t, { x: xx, y, size: groesse, font: schrift, color: o.farbe ?? FARBE.text })
  }

  linie(y = this.y, farbe = FARBE.linie) {
    this.seite.drawLine({ start: { x: this.rand.l, y }, end: { x: A4.w - this.rand.r, y }, thickness: 0.6, color: farbe })
  }

  abstand(h: number) { this.y -= h }

  async bytes() { return this.doc.save() }
}
