import Lenis from 'lenis'
import type { LenisOptions } from 'lenis'

type VirtualScrollData = Parameters<NonNullable<LenisOptions['virtualScroll']>>[0]
/** Gibt false zurueck, wenn Lenis diese Geste NICHT selbst scrollen soll. */
type Interceptor = (data: VirtualScrollData) => boolean

const instance = shallowRef<Lenis | null>(null)
const interceptors = new Set<Interceptor>()

/**
 * Zugriff auf das laufende Lenis fuer Seiten, die gezielt scrollen wollen,
 * etwa die Startseite mit ihrem Einrasten. intercept() liefert die
 * Abmeldefunktion zurueck.
 */
export function useLenis() {
  return {
    lenis: instance,
    intercept(fn: Interceptor) {
      interceptors.add(fn)
      return () => { interceptors.delete(fn) }
    },
  }
}

/**
 * Trägheitsscrollen. Das ist der halbe Charakter der Referenzseite.
 *
 * Zwei Dinge sind hier nicht optional:
 * - nur clientseitig, Lenis fasst window an
 * - aus bei prefers-reduced-motion, sonst wird Nutzern mit
 *   vestibulären Beschwerden schlecht
 */
export function useLenisScroll() {
  if (import.meta.server) return

  onMounted(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      // anchors: Links auf #abschnitt scrollen weich statt zu springen.
      anchors: true,
      // Jede Mausrad-Geste laeuft erst durch die angemeldeten Abfaenger.
      virtualScroll: data => [...interceptors].every(fn => fn(data)),
    })
    instance.value = lenis
    // Nur in der Entwicklung: zum Testen von Scroll-Verhalten aus der Konsole.
    if (import.meta.dev) Object.assign(window, { __lenis: lenis })
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    onBeforeUnmount(() => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      instance.value = null
    })
  })
}
