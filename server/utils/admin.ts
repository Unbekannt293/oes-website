import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * Verwaltung fuer Louis (/admin). Ein gemeinsames Passwort aus der
 * Server-Konfiguration, danach ein verschluesseltes Sitzungs-Cookie
 * (httpOnly, nur gleiche Seite). Der Browser sieht nie das Passwort oder
 * den Datenbankschluessel, alle Aenderungen laufen ueber /api/admin.
 */
export async function adminSitzung(event: H3Event) {
  const geheimnis = useRuntimeConfig(event).adminSessionSecret
  if (!geheimnis || geheimnis.length < 32) {
    throw createError({ statusCode: 503, statusMessage: 'Verwaltung ist noch nicht eingerichtet' })
  }
  return useSession<{ admin?: boolean }>(event, {
    name: 'oes-admin',
    password: geheimnis,
    maxAge: 60 * 60 * 24 * 14,   // zwei Wochen angemeldet bleiben (Handy)
    cookie: { httpOnly: true, sameSite: 'strict', secure: !import.meta.dev, path: '/' },
  })
}

/** Passwort vergleichen, ohne dass die Antwortzeit verraet, wie viel stimmt. */
export function passwortStimmt(event: H3Event, eingabe: string) {
  const soll = useRuntimeConfig(event).adminPassword
  if (!soll) return false
  const a = createHash('sha256').update(eingabe).digest()
  const b = createHash('sha256').update(soll).digest()
  return timingSafeEqual(a, b)
}

/*
 * Bremse gegen Passwort-Raten: Fehlversuche je IP-Adresse, im Speicher
 * des Servers. Auf Netlify hat jede Funktions-Instanz ihren eigenen
 * Speicher, die Bremse ist also grob, aber gegen einfaches Durchprobieren
 * reicht sie.
 */
interface Versuche { anzahl: number, erster: number }
const fehlversuche = new Map<string, Versuche>()

export function fehlversuchMerken(ip: string) {
  const v = fehlversuche.get(ip)
  fehlversuche.set(ip, v ? { ...v, anzahl: v.anzahl + 1 } : { anzahl: 1, erster: Date.now() })
}

export function versucheZuruecksetzen(ip: string) {
  fehlversuche.delete(ip)
}

/** 5 Fehlversuche, dann 15 Minuten Pause ab dem ersten Fehlversuch (Lukas, 31.10.2026). */
const MAX_VERSUCHE = 5
const SPERRE_MS = 15 * 60 * 1000

/** true = diese IP darf es gerade nicht erneut versuchen. */
export function anmeldungGesperrt(ip: string): boolean {
  const v = fehlversuche.get(ip)
  if (!v) return false
  // Wartezeit vorbei: Eintrag weg, sonst waechst die Liste und die IP
  // bliebe fuer immer gesperrt.
  if (Date.now() - v.erster > SPERRE_MS) {
    fehlversuche.delete(ip)
    return false
  }
  return v.anzahl >= MAX_VERSUCHE
}
