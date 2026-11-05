import { BILD_MAX_BYTES } from '~~/shared/bewertungen'

/**
 * Fotos zu Bewertungen im Supabase-Storage-Bucket "bewertungen"
 * (supabase/migrationen/2026-11-05-bewertungsbilder.sql).
 *
 * Der Browser verkleinert jedes Foto ueber ein Canvas und schickt ein
 * frisches JPEG. Das hat zwei Vorteile: kleine Dateien und keine
 * Metadaten, denn Handyfotos tragen im EXIF-Block oft den genauen
 * Aufnahmeort. Der Server verlaesst sich darauf nicht, sondern prueft
 * selbst: echtes JPEG, nicht zu gross, kein EXIF/XMP. Alles andere wird
 * verworfen.
 */
const BUCKET = 'bewertungen'

/** Ist das ein sauberes JPEG ohne Metadaten? */
export function jpegSauber(buf: Buffer) {
  if (buf.length < 100 || buf.length > BILD_MAX_BYTES) return false
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return false
  // Segmente bis zum Bildanfang (SOS) durchgehen: FF xx, dann 2 Byte Laenge.
  let i = 2
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xFF) return false
    const marker = buf[i + 1]!
    if (marker === 0xDA) return true // Start of Scan: ab hier nur Bilddaten
    const laenge = buf.readUInt16BE(i + 2)
    if (laenge < 2) return false
    // APP1 enthaelt EXIF (mit GPS) oder XMP: so etwas erzeugt ein Canvas nie.
    if (marker === 0xE1) return false
    i += 2 + laenge
  }
  return false
}

/** Data-URLs pruefen und hochladen. Gibt die gespeicherten Pfade zurueck. */
export async function bilderSpeichern(bewertungId: string, dataUrls: string[]) {
  const storage = useSupabase().storage.from(BUCKET)
  const pfade: string[] = []
  for (const url of dataUrls) {
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
    if (!jpegSauber(buf)) {
      console.warn('[bewertungen] Foto verworfen (kein sauberes JPEG)')
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
