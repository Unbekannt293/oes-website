import type { H3Event } from 'h3'

/*
 * Schutz der oeffentlichen Formulare gegen Bots, ohne Captcha (kein
 * Drittanbieter, keine Einwilligung noetig):
 *  1. unsichtbares Feld "website" (Honeypot), in den Schemas
 *  2. Zeitfalle: Menschen brauchen fuer ein Formular mehr als 3 Sekunden
 *  3. Bremse: hoechstens n Anfragen je IP-Adresse und Zeitfenster
 * Die Zaehler liegen im Speicher des Servers. Auf Netlify hat jede
 * Funktions-Instanz ihren eigenen Speicher, die Bremse ist dort also grob,
 * gegen Massen-Spam reicht sie.
 */
const zaehler = new Map<string, { anzahl: number, seit: number }>()

export function bremse(event: H3Event, name: string, max: number, fensterMs: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unbekannt'
  const key = `${name}:${ip}`
  const jetzt = Date.now()
  const z = zaehler.get(key)
  if (!z || jetzt - z.seit > fensterMs) {
    zaehler.set(key, { anzahl: 1, seit: jetzt })
    if (zaehler.size > 5000) aufraeumen(fensterMs)
    return
  }
  if (z.anzahl >= max) {
    throw createError({ statusCode: 429, statusMessage: 'Zu viele Anfragen, bitte später erneut versuchen' })
  }
  z.anzahl++
}

function aufraeumen(fensterMs: number) {
  const jetzt = Date.now()
  for (const [k, z] of zaehler) if (jetzt - z.seit > fensterMs) zaehler.delete(k)
}

/**
 * Zeitfalle: ausfuellzeit misst der Browser selbst (ms seit dem Oeffnen des
 * Formulars, beide Zeiten von derselben Uhr). Fehlt sie, kam die Anfrage
 * nicht aus unserem Formular.
 */
export function zuSchnell(ausfuellzeit: number | undefined) {
  return typeof ausfuellzeit !== 'number' || ausfuellzeit < 3000
}

export const STUNDE = 60 * 60 * 1000
