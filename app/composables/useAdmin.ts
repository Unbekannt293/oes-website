/**
 * Aufrufe an /api/admin aus den Verwaltungsseiten. Laeuft die Sitzung ab
 * (401), geht es zur Anmeldung zurueck statt mit einer Fehlermeldung.
 */
export function useAdmin() {
  async function api<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}) {
    try {
      return await $fetch<T>(url, opts)
    }
    catch (err) {
      const e = err as { statusCode?: number, statusMessage?: string, data?: { statusMessage?: string } }
      if (e.statusCode === 401) await navigateTo('/admin/anmelden')
      throw new Error(e.data?.statusMessage ?? e.statusMessage ?? 'Das hat nicht geklappt')
    }
  }
  async function abmelden() {
    await $fetch('/api/admin/abmelden', { method: 'POST' }).catch(() => {})
    await navigateTo('/admin/anmelden')
  }
  return { api, abmelden }
}

/** "2026-10-24" -> "Sa., 24.10.2026" */
export function adminDatum(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' })
    .format(new Date(`${iso}T12:00:00Z`))
}
