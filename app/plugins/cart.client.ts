import type { CartLine } from '~~/shared/types'
import { CART_STORAGE_KEY, KAUTION_STORAGE_KEY, LOGO_STORAGE_KEY } from '~/composables/useCart'

// Warenkorb aus dem localStorage laden, aber erst nach dem Hydrieren, damit
// Server- und Browser-HTML gleich sind. Danach jede Aenderung zurueckschreiben.
// localStorage kann fehlen oder werfen (privates Fenster): dann leer starten.
// onNuxtReady statt 'app:mounted': die Seiten hydrieren in <Suspense> erst
// nach app:mounted und saehen sonst schon den geladenen Korb (Hydrierungsfehler,
// z. B. blieb im Warenkorb die Klasse des Ladezustands haengen).
export default defineNuxtPlugin(() => {
  const { lines, loaded, kaution, logo } = useCart()

  onNuxtReady(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')
      if (Array.isArray(saved)) lines.value = saved as CartLine[]
    }
    catch { /* leer starten */ }
    try {
      const k = localStorage.getItem(KAUTION_STORAGE_KEY)
      if (k === 'bar' || k === 'ueberweisung') kaution.value = k
    }
    catch { /* Standard: bar */ }
    try {
      const l = JSON.parse(localStorage.getItem(LOGO_STORAGE_KEY) ?? 'null')
      if (l && typeof l.daten === 'string') logo.value = l
    }
    catch { /* ohne Logo */ }
    loaded.value = true

    watch(logo, (value) => {
      try {
        if (value) localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(value))
        else localStorage.removeItem(LOGO_STORAGE_KEY)
      }
      catch { /* zu gross oder gesperrt: bleibt fuer diese Sitzung */ }
    })

    watch(kaution, (value) => {
      try { localStorage.setItem(KAUTION_STORAGE_KEY, value) }
      catch { /* nicht speicherbar */ }
    })

    watch(lines, (value) => {
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value)) }
      catch { /* nicht speicherbar, bleibt fuer diese Sitzung */ }
    }, { deep: true })
  })
})
