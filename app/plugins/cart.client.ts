import type { CartLine } from '~~/shared/types'
import { CART_STORAGE_KEY } from '~/composables/useCart'

// Warenkorb aus dem localStorage laden, aber erst nach dem Hydrieren, damit
// Server- und Browser-HTML gleich sind. Danach jede Aenderung zurueckschreiben.
// localStorage kann fehlen oder werfen (privates Fenster): dann leer starten.
export default defineNuxtPlugin((nuxtApp) => {
  const { lines, loaded } = useCart()

  nuxtApp.hook('app:mounted', () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')
      if (Array.isArray(saved)) lines.value = saved as CartLine[]
    }
    catch { /* leer starten */ }
    loaded.value = true

    watch(lines, (value) => {
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value)) }
      catch { /* nicht speicherbar, bleibt fuer diese Sitzung */ }
    }, { deep: true })
  })
})
