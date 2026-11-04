// GET /api/rechtstexte/agb bzw. /api/rechtstexte/datenschutz: das PDF.
// ?download=1 laedt es herunter, sonst wird es angezeigt (Leser auf der Seite).
export default defineEventHandler(async (event) => {
  const r = rechtstextNach(getRouterParam(event, 'name'))
  const { bytes } = await rechtstextBauen(r.text)
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${getQuery(event).download ? 'attachment' : 'inline'}; filename="${r.datei}"`,
    'Cache-Control': 'public, max-age=3600',
  })
  return Buffer.from(bytes)
})
