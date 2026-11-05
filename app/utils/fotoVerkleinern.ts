import { BILD_KANTE, BILD_MAX_BYTES } from '~~/shared/bewertungen'

/**
 * Foto fuer eine Bewertung vorbereiten: auf hoechstens BILD_KANTE Pixel an
 * der langen Seite verkleinern und als frisches JPEG ausgeben. Das Canvas
 * schreibt keine Metadaten, Aufnahmeort und Kameradaten bleiben also auf
 * dem Handy. iPhone-Fotos (HEIC) wandelt Safari beim Auswaehlen selbst um.
 * Gibt eine Data-URL zurueck, die der Server noch einmal prueft.
 */
export async function fotoVerkleinern(datei: File): Promise<string> {
  // imageOrientation: hochkant fotografierte Bilder stehen sonst quer.
  const bild = await createImageBitmap(datei, { imageOrientation: 'from-image' })
  const faktor = Math.min(1, BILD_KANTE / Math.max(bild.width, bild.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bild.width * faktor)
  canvas.height = Math.round(bild.height * faktor)
  const ctx = canvas.getContext('2d')!
  // Weiss statt schwarz hinter transparenten PNGs.
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bild, 0, 0, canvas.width, canvas.height)
  bild.close()

  // Erst gute Qualitaet, bei sehr detailreichen Fotos etwas staerker komprimieren.
  for (const q of [0.82, 0.7, 0.55]) {
    const url = canvas.toDataURL('image/jpeg', q)
    if ((url.length - 23) * 0.75 <= BILD_MAX_BYTES) return url
  }
  throw new Error('Foto zu groß')
}
