/**
 * Ein Bildschirm, ein Schritt: Im Hero fuehrt eine Mausrad-Geste nach unten
 * direkt zum naechsten Abschnitt, nach oben zurueck an den Seitenanfang.
 * Unterhalb wird ganz normal gescrollt.
 *
 * Bewusst ueber Lenis' virtualScroll statt CSS scroll-snap: Lenis setzt die
 * Scrollposition jeden Frame selbst, CSS-Snap wuerde dagegen arbeiten. Und
 * lenis-snap rastet erst nach dem Scrollen ein, man rutscht also erst und wird
 * dann zurechtgezogen. Hier wird die Geste abgefangen, bevor gescrollt wird.
 *
 * Touch scrollt Lenis nicht selbst, dort uebernimmt CSS-Snap (siehe index.vue).
 */
export function useSectionSnap(next: Ref<HTMLElement | null>) {
  const { lenis, intercept } = useLenis()
  let snapping = false
  let snapEnd = 0
  let quietUntil = 0

  /** Ziel: Abschnitt beginnt direkt unter dem klebenden Header. */
  function targetY() {
    const el = next.value
    if (!el) return 0
    const header = document.querySelector<HTMLElement>('.hdr')?.offsetHeight ?? 0
    return Math.round(el.getBoundingClientRect().top + window.scrollY - header)
  }

  function go(to: number) {
    const l = lenis.value
    if (!l) {
      window.scrollTo({ top: to, behavior: 'smooth' })
      return
    }
    snapping = true
    l.scrollTo(to, {
      duration: 1.1,
      easing: t => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
      lock: true,
      force: true,
      onComplete: () => {
        snapping = false
        snapEnd = performance.now()
        quietUntil = snapEnd + 160
      },
    })
  }

  function goNext() {
    go(targetY())
  }

  onMounted(() => {
    const stop = intercept(({ deltaY, event }) => {
      if (event.type.startsWith('touch')) return true
      if (snapping) return false

      // Trackpad-Nachlauf schlucken: nach dem Einrasten kommen noch
      // abklingende Ereignisse. Solange sie ohne Pause von 160 ms weiter
      // eintreffen, gehoeren sie zur alten Geste (hoechstens 1,2 s lang).
      const now = performance.now()
      if (now < quietUntil && now - snapEnd < 1200) {
        quietUntil = now + 160
        return false
      }

      const y = window.scrollY
      const t = targetY()
      const inHero = y < t - 4
      if (Math.abs(deltaY) < 4) return !inHero          // Zittern im Hero ignorieren

      if (inHero) {
        go(deltaY > 0 ? t : 0)
        return false
      }
      // Ganz oben in der Vorschau nach oben: zurueck zum Hero, nicht halb.
      if (y <= t + 4 && deltaY < 0) {
        go(0)
        return false
      }
      return true
    })
    onBeforeUnmount(stop)
  })

  return { goNext }
}
