import { createHmac } from 'node:crypto'

// Laeuft zweimal am Morgen (Netlify "Scheduled Function", auch im Gratis-Tarif).
//
// 1. Supabase wach halten: Projekte im Gratis-Tarif pausieren nach 7 Tagen
//    ohne Zugriffe. Ein kleiner Lesezugriff direkt auf die Datenbank,
//    unabhaengig davon, ob die Website gerade funktioniert.
// 2. Zahlungsfristen pruefen: offene Ueberweisungen erinnern bzw. nach
//    Fristablauf stornieren (server/utils/zahlungsfristen.ts). Erster Lauf:
//    nur Vorwarnung an Louis. Zweiter Lauf 4 Stunden spaeter: Mails an die
//    Kunden, sofern Louis bis dahin nichts abgehakt hat. Das macht die
//    Website selbst, weil dort Mails, Datenbank und Texte schon liegen. Diese
//    Funktion stoesst sie nur an, mit einem Tagestoken aus
//    NUXT_ADMIN_SESSION_SECRET.
//
// Umgebungsvariablen sind dieselben wie fuer die Website. Ob es laeuft:
// Netlify -> Logs -> Functions -> taeglich.

export default async function taeglich(): Promise<Response> {
  const heute = new Date().toISOString().slice(0, 10)
  let ok = true

  const url = process.env.NUXT_SUPABASE_URL
  const key = process.env.NUXT_SUPABASE_SECRET_KEY
  if (url && key) {
    const res = await fetch(`${url}/rest/v1/rpc/freie_geraete`, {
      method: 'POST',
      headers: { 'apikey': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_geraet: 'fotobox', p_von: heute, p_bis: heute }),
    }).catch(() => null)
    console.log(`[taeglich] ${heute}: Supabase antwortet ${res?.status ?? 'nicht'}`)
    ok &&= !!res?.ok
  }
  else {
    console.warn('[taeglich] Supabase-Variablen fehlen')
    ok = false
  }

  const secret = process.env.NUXT_ADMIN_SESSION_SECRET
  // URL setzt Netlify selbst (Hauptadresse der Seite).
  const seite = process.env.URL || 'https://ottos-eventservice.de'
  if (secret) {
    const token = createHmac('sha256', secret).update(`oes-taeglich:${heute}`).digest('hex')
    // 6 Uhr UTC = Vorwarnung, 10 Uhr UTC = ausfuehren (siehe schedule).
    const schritt = new Date().getUTCHours() < 8 ? 'vorwarnen' : 'ausfuehren'
    const res = await fetch(`${seite}/api/intern/taeglich`, {
      method: 'POST',
      headers: { 'x-oes-taeglich': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ schritt }),
    }).catch(() => null)
    console.log(`[taeglich] Zahlungsfristen (${schritt}): ${res?.status ?? 'nicht erreichbar'} ${res ? await res.text() : ''}`)
    ok &&= !!res?.ok
  }
  else {
    console.warn('[taeglich] NUXT_ADMIN_SESSION_SECRET fehlt, Zahlungsfristen nicht geprueft')
  }

  return new Response(null, { status: ok ? 200 : 502 })
}

export const config = {
  // 6 und 10 Uhr UTC = 7 und 11 Uhr (Winter) bzw. 8 und 12 Uhr (Sommer) in Hamburg.
  schedule: '0 6,10 * * *',
}
