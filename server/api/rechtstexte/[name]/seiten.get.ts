// GET /api/rechtstexte/agb/seiten: je Abschnitt die PDF-Seite, auf der er beginnt.
export default defineEventHandler(async (event) => {
  const r = rechtstextNach(getRouterParam(event, 'name'))
  const { seiten } = await rechtstextBauen(r.text)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return { seiten, datei: r.datei }
})
