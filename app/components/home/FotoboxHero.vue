<script setup lang="ts">
// Hero nach dem Vorbild von landonorris.com: Fluid-Spur legt den Blitz-
// Zustand der Fotobox frei, Klick loest den Blitz aus. Die WebGL-Engine
// wird erst nach dem ersten Bild nachgeladen, damit three.js den Seitenaufbau
// nicht bremst. Bis dahin (und ohne WebGL) steht hier das statische Foto.
import type { FotoboxHero } from '~/lib/fotobox-hero/hero'

defineProps<{ alt: string }>()

const IMAGE = '/images/hero/fotobox.webp'
const MAPS = '/images/hero/fotobox-maps.png'
/** Mitte des Lichtpanels relativ im Bild: dort sitzt bei einer Fotobox der Blitz. */
const FLASH_AT: [number, number] = [0.498, 0.2347]

const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)

let hero: FotoboxHero | null = null
let io: IntersectionObserver | null = null
let unmounted = false

onMounted(async () => {
  try {
    const { createFotoboxHero } = await import('~/lib/fotobox-hero/hero')
    const tokens = getComputedStyle(document.documentElement)
    const created = await createFotoboxHero(canvas.value!, root.value!, {
      image: IMAGE,
      maps: MAPS,
      flashAt: FLASH_AT,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      colors: {
        paper: tokens.getPropertyValue('--c-paper'),
        line: '#D3CBBE',
        gold: tokens.getPropertyValue('--c-gold'),
      },
    })
    // Seite schon verlassen, waehrend Texturen luden? Dann gleich wieder abbauen.
    if (unmounted) {
      created.destroy()
      return
    }
    hero = created
    ready.value = true

    // Ausserhalb des Sichtfelds nichts rechnen: spart Akku.
    io = new IntersectionObserver(([entry]) => hero?.setVisible(!!entry?.isIntersecting))
    io.observe(root.value!)
  }
  catch (err) {
    console.warn('[FotoboxHero] WebGL nicht verfuegbar, statisches Bild bleibt.', err)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  io?.disconnect()
  hero?.destroy()
  hero = null
})

function onMove(e: PointerEvent) {
  hero?.pointerMove(e.clientX, e.clientY)
}

function onLeave() {
  hero?.pointerLeave()
}

function onClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('a, button')) return
  hero?.flash()
}
</script>

<template>
  <div
    ref="root" class="fbh" :class="{ 'is-ready': ready }"
    @pointermove="onMove" @pointerleave="onLeave" @click="onClick"
  >
    <img
      class="fbh__fallback" :src="IMAGE" :alt="alt"
      fetchpriority="high" decoding="async" draggable="false"
    >
    <canvas ref="canvas" class="fbh__canvas" aria-hidden="true" />
    <div class="fbh__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.fbh {
  /* Lage der Fotobox: Mitte bei --fb-x der Breite, --fb-h der Hoehe hoch,
     unten buendig. Die WebGL-Engine liest dieselben Werte. Gesetzt wird
     beides von aussen, hier nur Rueckfallwerte per var(). */
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: var(--c-paper);
  touch-action: pan-y;
}

.fbh__fallback {
  position: absolute;
  bottom: 0;
  left: calc(var(--fb-x, 0.5) * 100%);
  height: calc(var(--fb-h, 0.95) * 100%);
  width: auto;
  max-width: none;
  transform: translateX(-50%);
  user-select: none;
  -webkit-user-drag: none;
}

.fbh__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 700ms var(--e-out);
}
.is-ready .fbh__canvas { opacity: 1; }

.fbh__content {
  position: relative;
  z-index: 1;
}
</style>
