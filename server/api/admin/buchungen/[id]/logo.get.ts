import { z } from 'zod'

// GET /api/admin/buchungen/<id>/logo: das hochgeladene Logo fuers Layout
// (privater Bucket, nur ueber die Verwaltung erreichbar).
// ?ansicht=1 zeigt es im Browser (Vorschau in der Buchung), sonst Download.
// SVG kann Skripte enthalten: die Sandbox-CSP verhindert, dass sie auf
// unserer Seite laufen, auch wenn jemand die Datei direkt oeffnet.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.uuid() }).parse)
  const ansicht = getQuery(event).ansicht === '1'
  const { data: b } = await useSupabase().from('buchungen').select('*').eq('id', id).single()
  if (!b?.logo_pfad) throw createError({ statusCode: 404, statusMessage: 'Kein Logo' })
  const logo = await logoLaden(b.logo_pfad)
  if (!logo) throw createError({ statusCode: 404, statusMessage: 'Logo nicht gefunden' })
  setResponseHeaders(event, {
    'Content-Type': logo.typ,
    'Content-Disposition': `${ansicht ? 'inline' : 'attachment'}; filename="Logo_${b.nummer}_${logo.datei}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(logo.typ === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox" } : {}),
  })
  return logo.buf
})
