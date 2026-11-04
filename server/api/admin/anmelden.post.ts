import { z } from 'zod'

// POST /api/admin/anmelden { passwort }
export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unbekannt'
  if (anmeldungGesperrt(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Zu viele Versuche, bitte später erneut' })
  }
  const { passwort } = await readValidatedBody(event, z.object({ passwort: z.string().max(200) }).parse)
  if (!passwortStimmt(event, passwort)) {
    fehlversuchMerken(ip)
    throw createError({ statusCode: 401, statusMessage: 'Passwort falsch' })
  }
  versucheZuruecksetzen(ip)
  const sitzung = await adminSitzung(event)
  await sitzung.update({ admin: true })
  return { ok: true }
})
