import { FIRMA } from '~~/shared/firma'
import type { Rechtstext } from '~~/shared/rechtstexte/typ'
import { A4, Blatt, FARBE, sicher } from './pdf'

/**
 * Rechtstext (z. B. Mietbedingungen) als PDF fuer den Mailanhang und den
 * Download auf /agb. Gleiche Daten wie die Seite (shared/rechtstexte).
 * Unten auf jeder Seite Firma und "Seite x von n".
 */
export async function rechtstextPdf(t: Rechtstext): Promise<Uint8Array> {
  return (await rechtstextBauen(t)).bytes
}

/**
 * PDF und zu jedem Abschnitt, wo er beginnt: Seite (ab 1) und Hoehe auf der
 * Seite (0 = oben, 1 = unten). Damit springt das Inhaltsverzeichnis im Leser
 * genau auf die Ueberschrift.
 */
export interface AbschnittStelle { seite: number, oben: number }
export async function rechtstextBauen(t: Rechtstext): Promise<{ bytes: Uint8Array, seiten: AbschnittStelle[] }> {
  const b = await Blatt.neu({ l: 56, r: 56, o: 56, u: 70 })
  const seiten: AbschnittStelle[] = []
  b.text(t.titel, { groesse: 16, schrift: b.s.fett })
  b.text(`${FIRMA.name} · ${t.stand}`, { groesse: 9, farbe: FARBE.grau })
  b.abstand(10)

  for (const a of t.abschnitte) {
    b.platz(40)   // Ueberschrift nicht allein unten auf der Seite
    seiten.push({ seite: b.doc.getPageCount(), oben: Math.round((1 - b.y / A4.h) * 1000) / 1000 })
    b.abstand(6)
    b.text(a.titel, { groesse: 11, schrift: b.s.fett })
    a.absaetze.forEach((p, i) => {
      b.text(p, { groesse: 9.5, zeilenabstand: 13.5 })
      b.abstand(4)
      if (a.tabelle && a.tabelleNach === i + 1) {
        const mitte = b.rand.l + b.breite * 0.62
        for (const [l, r] of [a.tabelle.kopf, ...a.tabelle.zeilen]) {
          const kopf = l === a.tabelle.kopf[0]
          b.platz(18)
          b.an(l, b.rand.l + 6, b.y - 12, { groesse: 9, schrift: kopf ? b.s.fett : b.s.normal })
          b.an(r, mitte, b.y - 12, { groesse: 9, schrift: kopf ? b.s.fett : b.s.normal })
          b.y -= 18
          b.linie(b.y)
        }
        b.abstand(8)
      }
    })
  }

  const alle = b.doc.getPages()
  alle.forEach((s, i) => {
    s.drawText(sicher(`${FIRMA.name} · ${FIRMA.strasse}, ${FIRMA.plz} ${FIRMA.ort}`), { x: 56, y: 36, size: 8, font: b.s.normal, color: FARBE.grau })
    const n = `Seite ${i + 1} von ${alle.length}`
    s.drawText(n, { x: A4.w - 56 - b.s.normal.widthOfTextAtSize(n, 8), y: 36, size: 8, font: b.s.normal, color: FARBE.grau })
  })
  return { bytes: await b.bytes(), seiten }
}
