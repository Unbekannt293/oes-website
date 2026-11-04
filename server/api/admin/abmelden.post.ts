// POST /api/admin/abmelden
export default defineEventHandler(async (event) => {
  const sitzung = await adminSitzung(event)
  await sitzung.clear()
  return { ok: true }
})
