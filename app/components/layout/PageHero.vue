<script setup lang="ts">
// Kopf jeder Unterseite: der schwarze Balken aus den Mockups, darin
// Titel, goldener Stern-Trenner und eine Zeile Unterzeile. Dahinter
// dasselbe Buehnenlicht wie im Startseiten-Hero (Lichterketten, Sterne).
// Ohne WebGL2 bleibt der CSS-Verlauf stehen.
import type { StageLights } from '~/lib/stage-lights/renderer'

defineProps<{ title: string, sub?: string, eyebrow?: string }>()

const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)

let lights: StageLights | null = null
let io: IntersectionObserver | null = null
let unmounted = false

onMounted(async () => {
  const canvasEl = canvas.value
  const rootEl = root.value
  if (!canvasEl || !rootEl) return
  try {
    const { createStageLights } = await import('~/lib/stage-lights/renderer')
    if (unmounted) return
    lights = createStageLights(canvasEl, {
      bg: '#0B0A09',
      gold: getComputedStyle(document.documentElement).getPropertyValue('--c-gold'),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
    ready.value = true
    // Weggescrollt: nicht weiterrechnen.
    io = new IntersectionObserver(([e]) => lights?.setVisible(!!e?.isIntersecting))
    io.observe(rootEl)
  }
  catch (err) {
    console.warn('[PageHero] WebGL2 nicht verfuegbar, Verlauf bleibt.', err)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  io?.disconnect()
  lights?.destroy()
  lights = null
})
</script>

<template>
  <header
    ref="root" class="ph on-ink" :class="{ 'is-ready': ready }"
    @pointermove="lights?.pointerMove($event.clientX, $event.clientY)"
    @pointerleave="lights?.pointerLeave()"
  >
    <canvas ref="canvas" class="ph__canvas" aria-hidden="true" />
    <div class="ph__veil" aria-hidden="true" />
    <div class="shell ph__inner">
      <p v-if="eyebrow" class="label ph__eyebrow">{{ eyebrow }}</p>
      <h1 class="display ph__title">{{ title }}</h1>
      <div class="ph__rule" aria-hidden="true">
        <span /><svg viewBox="0 0 24 24" width="11" height="11"><path
          d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3-6.3-4.6L5.7 21 8 13.7 2 9.2h7.6z"
          fill="currentColor" /></svg><span />
      </div>
      <p v-if="sub" class="ph__sub">{{ sub }}</p>
    </div>
  </header>
</template>

<style scoped>
.ph {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  /* Rueckfall und erstes Bild, bis der Shader laeuft: derselbe warme
     Schein von oben, den der Shader dann mit Lichtern fuellt. */
  background:
    radial-gradient(ellipse 55% 90% at 50% -10%, rgb(195 139 55 / 0.14), transparent 70%),
    #0B0A09;
}
/* Goldene Haarlinie als Uebergang zum hellen Inhalt, zu den Raendern hin
   ausgeblendet. */
.ph::after {
  content: '';
  position: absolute; inset-inline: 0; bottom: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-gold) 50%, transparent);
  opacity: 0.55;
  z-index: 2;
}

.ph__canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  opacity: 0;
  transition: opacity var(--d-slow) var(--e-out);
  z-index: -1;
}
.is-ready .ph__canvas { opacity: 1; }

/* Dunkler Hof hinter dem Text: die Lichter bleiben Kulisse, der Titel
   bleibt lesbar. */
.ph__veil {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 36% 70% at 50% 58%, rgb(11 10 9 / 0.7), transparent 75%);
  pointer-events: none;
  z-index: -1;
}

.ph__inner {
  display: grid; justify-items: center; gap: var(--s-3);
  text-align: center;
  padding-block: clamp(3rem, 2rem + 5vw, 5.5rem) clamp(2.75rem, 1.8rem + 4vw, 4.75rem);
}

.ph__eyebrow { color: var(--c-gold); }
.ph__title { font-size: var(--t-h1); }

.ph__rule {
  display: flex; align-items: center; gap: var(--s-2);
  width: min(220px, 60%); color: var(--c-gold);
}
.ph__rule span { flex: 1; height: 1px; background: var(--c-gold-hair); }

.ph__sub {
  max-width: 46ch;
  color: var(--c-text-muted);
  font-size: clamp(1.05rem, 0.98rem + 0.3vw, 1.2rem);
}

@media (max-width: 560px) {
  .ph__veil { background: radial-gradient(ellipse 70% 70% at 50% 58%, rgb(11 10 9 / 0.7), transparent 75%); }
}
</style>
