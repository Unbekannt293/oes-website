// Alle /api/admin-Routen nur mit Anmeldung. Hier zentral statt in jeder
// Route, damit eine neue Route nicht aus Versehen offen ist.
const OFFEN = new Set(['/api/admin/anmelden', '/api/admin/status'])

export default defineEventHandler(async (event) => {
  const pfad = getRequestURL(event).pathname
  if (!pfad.startsWith('/api/admin/') || OFFEN.has(pfad)) return
  const sitzung = await adminSitzung(event)
  if (!sitzung.data.admin) throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet' })
})
