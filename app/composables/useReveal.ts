/**
 * Blendet ein Element ein, sobald es in den Viewport scrollt.
 * Einmalig, danach beobachtet niemand mehr mit.
 *
 * Verwendung:  <section ref="el" class="reveal">  +  useReveal(el)
 */
export function useReveal(target: Ref<HTMLElement | null>, threshold = 0.15) {
  if (import.meta.server) return

  onMounted(() => {
    const el = target.value
    if (!el) return

    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      el.classList.add('is-visible')
      io.disconnect()
    }, { threshold })

    io.observe(el)
    onBeforeUnmount(() => io.disconnect())
  })
}
