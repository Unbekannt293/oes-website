import Lenis from 'lenis'

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

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    onBeforeUnmount(() => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    })
  })
}
