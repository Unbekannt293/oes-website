import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

// Taegliche Aufgaben, aufgerufen von netlify/functions/taeglich.mts:
// morgens { schritt: 'vorwarnen' }, 4 Stunden spaeter { schritt: 'ausfuehren' }.
// Nicht oeffentlich: die Funktion schickt ein Token, das nur mit dem
// Sitzungs-Schluessel der Verwaltung (NUXT_ADMIN_SESSION_SECRET) zu
// berechnen ist. So braucht es keine weitere Umgebungsvariable, und der
// Schluessel selbst geht nie ueber die Leitung.
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).adminSessionSecret
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Nicht eingerichtet' })

  const token = getHeader(event, 'x-oes-taeglich') ?? ''
  // Heute oder gestern (UTC) gilt, falls der Aufruf um Mitternacht kippt.
  const gueltig = [0, 1].map(n => tagesToken(secret, new Date(Date.now() - n * 86_400_000)))
  if (!gueltig.some(t => gleich(t, token))) throw createError({ statusCode: 401, statusMessage: 'Nicht erlaubt' })

  const { schritt } = await readValidatedBody(event, z.object({ schritt: z.enum(['vorwarnen', 'ausfuehren']) }).parse)
  const bericht = await fristenPruefen(event, schritt)
  console.log('[taeglich]', JSON.stringify(bericht))
  return bericht
})

/** Gleiche Rechnung wie in netlify/functions/taeglich.mts. */
function tagesToken(secret: string, d: Date) {
  return createHmac('sha256', secret).update(`oes-taeglich:${d.toISOString().slice(0, 10)}`).digest('hex')
}

function gleich(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
