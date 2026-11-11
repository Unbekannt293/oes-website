import { LOGO_MAX_BYTES } from '~~/shared/buchung'

/**
 * Logos fuer das Fotolayout im privaten Storage-Bucket "logos"
 * (supabase/migrationen/2026-11-11-kasse.sql). Das Logo bleibt, wie es
 * ist (Transparenz, Aufloesung, Vektor), der Server prueft nur, dass es
 * wirklich ein PNG, JPEG, WebP, SVG oder PDF ist und nicht zu gross.
 * SVG kann Skripte enthalten: es wird darum nie oeffentlich ausgeliefert,
 * und die Verwaltung zeigt es nur mit Sandbox-CSP (logo.get.ts).
 */
const BUCKET = 'logos'

function logoTyp(buf: Buffer): { endung: string, typ: string } | null {
  if (buf.length < 32 || buf.length > LOGO_MAX_BYTES) return null
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return { endung: 'png', typ: 'image/png' }
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return { endung: 'jpg', typ: 'image/jpeg' }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { endung: 'webp', typ: 'image/webp' }
  if (buf.toString('ascii', 0, 5) === '%PDF-') return { endung: 'pdf', typ: 'application/pdf' }
  // SVG ist Text: "<svg" am Anfang (nach XML-Kopf, Kommentaren, BOM).
  const kopf = buf.toString('utf8', 0, 2048).replace(/^\uFEFF/, '')
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/i.test(kopf)) return { endung: 'svg', typ: 'image/svg+xml' }
  return null
}

/** Data-URL pruefen und speichern. Gibt den Pfad zurueck oder null. */
export async function logoSpeichern(buchungId: string, dataUrl: string) {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  const art = logoTyp(buf)
  if (!art) {
    console.warn('[logo] verworfen: kein PNG/JPEG/WebP oder zu gross')
    return null
  }
  const pfad = `${buchungId}/logo.${art.endung}`
  const { error } = await useSupabase().storage.from(BUCKET).upload(pfad, buf, { contentType: art.typ, upsert: true })
  if (error) {
    console.error('[logo] Upload fehlgeschlagen:', error.message)
    return null
  }
  return pfad
}

/** Logo laden (Mailanhang, Verwaltung). */
export async function logoLaden(pfad: string) {
  const { data, error } = await useSupabase().storage.from(BUCKET).download(pfad)
  if (error || !data) return null
  return { buf: Buffer.from(await data.arrayBuffer()), typ: data.type || 'application/octet-stream', datei: pfad.split('/').pop()! }
}
