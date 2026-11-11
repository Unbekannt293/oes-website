import { LOGO_TYPEN } from '~~/shared/buchung'

/**
 * Das Logo liegt bis zur Bestellung im Warenkorb (localStorage, meist nur
 * ~5 MB fuer die ganze Seite). Darum hier knapper als die 3 MB, die der
 * Server annimmt. Fuer ein Layout im Format 10x15 reichen 1600 px dicke.
 */
const IM_BROWSER_MAX = 1.5 * 1024 * 1024

/**
 * Logo fuer das Fotolayout einlesen. Anders als bei Bewertungsfotos bleibt
 * die Datei moeglichst unveraendert (Transparenz, Schaerfe). Nur wenn sie
 * zu gross ist, wird sie auf 1600 px an der langen Seite verkleinert, als
 * PNG, damit ein transparenter Hintergrund erhalten bleibt.
 */
export async function logoLesen(datei: File): Promise<string> {
  if (!(LOGO_TYPEN as readonly string[]).includes(datei.type)) {
    throw new Error('Bitte ein Logo als PNG, JPG, SVG oder PDF wählen.')
  }
  if (datei.size <= IM_BROWSER_MAX) return alsDataUrl(datei)
  // Vektor (SVG, PDF) laesst sich nicht sinnvoll verkleinern, ist aber fast immer klein.
  if (datei.type === 'image/svg+xml' || datei.type === 'application/pdf') {
    throw new Error('Die Datei ist zu groß. Bitte eine kleinere Datei (bis 1,5 MB) wählen.')
  }

  const bild = await createImageBitmap(datei)
  const faktor = Math.min(1, 1600 / Math.max(bild.width, bild.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bild.width * faktor)
  canvas.height = Math.round(bild.height * faktor)
  canvas.getContext('2d')!.drawImage(bild, 0, 0, canvas.width, canvas.height)
  bild.close()
  const url = canvas.toDataURL('image/png')
  if ((url.length - 22) * 0.75 > IM_BROWSER_MAX) throw new Error('Das Logo ist zu groß. Bitte eine kleinere Datei wählen.')
  return url
}

function alsDataUrl(datei: Blob) {
  return new Promise<string>((ok, fehler) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = () => fehler(new Error('Datei ließ sich nicht lesen.'))
    r.readAsDataURL(datei)
  })
}
