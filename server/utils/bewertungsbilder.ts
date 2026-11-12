import { BILD_MAX_BYTES } from '~~/shared/bewertungen'

/**
 * Fotos zu Bewertungen im Supabase-Storage-Bucket "bewertungen"
 * (supabase/migrationen/2026-11-05-bewertungsbilder.sql).
 *
 * Der Browser verkleinert jedes Foto ueber ein Canvas und schickt ein
 * frisches JPEG (kleine Datei, Aufnahmeort weg). Der Server verlaesst sich
 * darauf nicht: er prueft, dass es ein JPEG ist, und entfernt selbst alle
 * Metadaten-Bloecke. Wichtig, weil Safari/iPhone auch in Canvas-JPEGs einen
 * kleinen EXIF-Block schreiben; bis 12.11.2026 wurden diese Fotos deshalb
 * abgelehnt statt bereinigt.
 */
const BUCKET = 'bewertungen'

/**
 * Bloecke vor den Bilddaten, die bleiben duerfen: JFIF (APP0), Farbprofil
 * (APP2), Adobe-Farbinfo (APP14) und alles, was zum Bild selbst gehoert
 * (Tabellen, Groesse). Weg kommen EXIF/XMP (APP1, darin GPS), IPTC (APP13),
 * die uebrigen APPn und Kommentare (COM).
 */
function bleibt(marker: number) {
  if (marker === 0xE0 || marker === 0xE2 || marker === 0xEE) return true
  if (marker >= 0xE1 && marker <= 0xEF) return false
  return marker !== 0xFE
}

/** JPEG pruefen und Metadaten entfernen. null, wenn es kein gueltiges JPEG ist. */
export function jpegBereinigen(buf: Buffer): Buffer | null {
  if (buf.length < 100 || buf.length > BILD_MAX_BYTES) return null
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null
  const teile: Buffer[] = [buf.subarray(0, 2)]
  // Bloecke bis zum Bildanfang (SOS) durchgehen: FF xx, dann 2 Byte Laenge.
  let i = 2
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xFF) return null
    const marker = buf[i + 1]!
    if (marker === 0xDA) {
      teile.push(buf.subarray(i)) // ab hier nur Bilddaten
      return Buffer.concat(teile)
    }
    const laenge = buf.readUInt16BE(i + 2)
    if (laenge < 2 || i + 2 + laenge > buf.length) return null
    if (bleibt(marker)) teile.push(buf.subarray(i, i + 2 + laenge))
    i += 2 + laenge
  }
  return null
}

/** Data-URLs pruefen und hochladen. Gibt die gespeicherten Pfade zurueck. */
export async function bilderSpeichern(bewertungId: string, dataUrls: string[]) {
  const storage = useSupabase().storage.from(BUCKET)
  const pfade: string[] = []
  for (const url of dataUrls) {
    const buf = jpegBereinigen(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))
    if (!buf) {
      console.warn('[bewertungen] Foto verworfen (kein gueltiges JPEG oder zu gross)')
      continue
    }
    // Zufaelliger Name: die Adresse laesst sich nicht erraten.
    const pfad = `${bewertungId}/${crypto.randomUUID()}.jpg`
    const { error } = await storage.upload(pfad, buf, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
    if (error) console.error('[bewertungen] Foto-Upload fehlgeschlagen:', error.message)
    else pfade.push(pfad)
  }
  return pfade
}

export async function bilderLoeschen(pfade: string[]) {
  if (!pfade.length) return
  const { error } = await useSupabase().storage.from(BUCKET).remove(pfade)
  if (error) console.error('[bewertungen] Fotos nicht geloescht:', error.message)
}

/** Oeffentliche Adresse eines gespeicherten Fotos. */
export function bildUrl(pfad: string) {
  return `${useRuntimeConfig().supabaseUrl}/storage/v1/object/public/${BUCKET}/${pfad}`
}

/** Fuer Antworten an den Browser: Pfade durch volle Adressen ersetzen. */
export function mitBildUrls<T extends { bilder?: string[] | null }>(zeilen: T[]): T[] {
  return zeilen.map(z => ({ ...z, bilder: (z.bilder ?? []).map(bildUrl) }))
}
