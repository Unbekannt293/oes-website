// Einmal taeglich die Buchungsdatenbank ansprechen.
//
// Supabase pausiert Projekte im Gratis-Tarif nach 7 Tagen ohne Zugriffe.
// In einer ruhigen Woche wuerden Buchungen dann fehlschlagen, bis jemand
// das Projekt im Dashboard wieder startet. Ein kleiner Lesezugriff pro Tag
// reicht, damit das nie passiert.
//
// Netlify fuehrt Dateien mit `schedule` als zeitgesteuerte Funktion aus
// (auch im Gratis-Tarif). Die Umgebungsvariablen sind dieselben wie fuer
// die Website: NUXT_SUPABASE_URL und NUXT_SUPABASE_SECRET_KEY.

export default async function keepalive(): Promise<Response> {
  const url = process.env.NUXT_SUPABASE_URL
  const key = process.env.NUXT_SUPABASE_SECRET_KEY
  if (!url || !key) {
    console.warn('[keepalive] Supabase ist nicht eingerichtet, Umgebungsvariablen fehlen')
    return new Response('nicht eingerichtet', { status: 503 })
  }

  const heute = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${url}/rest/v1/rpc/freie_geraete`, {
    method: 'POST',
    headers: { 'apikey': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_geraet: 'fotobox', p_von: heute, p_bis: heute }),
  })

  // Steht im Netlify-Protokoll der Funktion: so sieht man, ob es laeuft.
  console.log(`[keepalive] ${heute}: Supabase antwortet ${res.status}`)
  return new Response(null, { status: res.ok ? 200 : 502 })
}

export const config = {
  // Taeglich um Mitternacht UTC.
  schedule: '@daily',
}
