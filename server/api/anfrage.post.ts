import { z } from 'zod'
import { anfrageSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = anfrageSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validierung fehlgeschlagen',
      data: { fields: z.flattenError(parsed.error).fieldErrors },
    })
  }

  // Honeypot: Bots fuellen unsichtbare Felder aus. Wir tun so, als
  // hätte es geklappt, damit sie es nicht erneut versuchen.
  if (parsed.data.website) {
    return { ok: true }
  }

  const cfg = useRuntimeConfig(event)

  if (!cfg.smtpHost) {
    // Noch kein Postfach konfiguriert. In der Entwicklung nicht so tun,
    // als wäre die Mail raus, sonst faellt es erst live auf.
    console.info('[anfrage] SMTP fehlt, Anfrage nur geloggt:', parsed.data)
    throw createError({
      statusCode: 503,
      statusMessage: 'Mailversand ist noch nicht eingerichtet',
    })
  }

  // TODO: nodemailer-Transport, Bestätigung an Kunde + Kopie an Louis.
  return { ok: true }
})
