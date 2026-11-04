// GET /api/admin/status: fuer die Seiten-Middleware, ob jemand angemeldet ist.
export default defineEventHandler(async (event) => {
  try {
    const sitzung = await adminSitzung(event)
    return { angemeldet: sitzung.data.admin === true, eingerichtet: true }
  }
  catch {
    return { angemeldet: false, eingerichtet: false }
  }
})
