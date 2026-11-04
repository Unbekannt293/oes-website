// Seiten unter /admin nur mit Anmeldung. Fragt den Server, weil das
// Sitzungs-Cookie httpOnly ist und im Browser nicht lesbar.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/anmelden') return
  const status = await useRequestFetch()('/api/admin/status').catch(() => ({ angemeldet: false }))
  if (!status.angemeldet) {
    return navigateTo({ path: '/admin/anmelden', query: { weiter: to.fullPath } })
  }
})
