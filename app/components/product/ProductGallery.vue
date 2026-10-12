<script setup lang="ts">
// Bilder eines Produkts zum Durchklicken. Technisch eine waagerechte
// Scroll-Leiste mit scroll-snap: auf dem Handy wischt man nativ, die
// Pfeile scrollen genau eine Bildbreite. Der aktive Punkt folgt der
// Scrollposition, egal ob per Pfeil, Wischen oder Vorschaubild.
const {
  images, alt, thumbs = false, width = 600, height = 600, eager = false,
} = defineProps<{
  images: string[]
  alt: string
  /** Vorschaubilder unter dem Bild (Detailseite). */
  thumbs?: boolean
  width?: number
  height?: number
  /** Erstes Bild sofort laden (Detailseite, oben im Sichtfeld). */
  eager?: boolean
}>()

const track = ref<HTMLElement | null>(null)
const thumbRow = ref<HTMLElement | null>(null)
const index = ref(0)

function go(i: number) {
  const el = track.value
  if (!el) return
  const n = images.length
  const next = (i + n) % n
  // Sofort umschalten statt aufs Scroll-Event zu warten: schnelles
  // Doppelklicken zaehlt dann vom neuen Bild aus weiter.
  index.value = next
  el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
}

// Aktives Vorschaubild in der (seitlich scrollbaren) Leiste sichtbar halten.
watch(index, (i) => {
  const row = thumbRow.value
  const t = row?.children[i] as HTMLElement | undefined
  if (!row || !t) return
  // Ueber die Bildschirmposition statt offsetLeft: die Leiste ist kein
  // positioniertes Element, offsetLeft wuerde sich auf die Seite beziehen.
  const dx = t.getBoundingClientRect().left - row.getBoundingClientRect().left
  row.scrollTo({ left: row.scrollLeft + dx - row.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' })
})

// Die Seite kann die Galerie zu einem Bild springen lassen (Auswahl im Buchungskasten).
defineExpose({ go })

function onScroll() {
  const el = track.value
  if (el) index.value = Math.round(el.scrollLeft / el.clientWidth)
}
</script>

<template>
  <div class="gal" :class="{ 'gal--thumbs': thumbs }">
    <div class="gal__stage">
      <div
        ref="track" class="gal__track" tabindex="-1"
        :aria-label="`${alt}, Bild ${index + 1} von ${images.length}`"
        @scroll.passive="onScroll"
      >
        <!-- Jedes Bild im eigenen Rahmen: ein Zoom beim Hovern bleibt darin,
             statt das Nachbarbild in den sichtbaren Bereich zu schieben. -->
        <div v-for="(src, i) in images" :key="src" class="gal__slide">
          <NuxtImg
            :src="src"
            :alt="i === 0 ? alt : `${alt}, Ansicht ${i + 1}`"
            :width="width" :height="height"
            :loading="eager && i === 0 ? 'eager' : 'lazy'"
            class="gal__img"
          />
        </div>
      </div>

      <template v-if="images.length > 1">
        <button type="button" class="gal__btn gal__btn--prev" @click.prevent.stop="go(index - 1)">
          <span class="visually-hidden">Vorheriges Bild</span>
          <UiIcon name="arrow" :size="16" class="gal__flip" />
        </button>
        <button type="button" class="gal__btn gal__btn--next" @click.prevent.stop="go(index + 1)">
          <span class="visually-hidden">Nächstes Bild</span>
          <UiIcon name="arrow" :size="16" />
        </button>
        <div v-if="!thumbs" class="gal__dots" aria-hidden="true">
          <span v-for="(_, i) in images" :key="i" :class="{ 'is-on': i === index }" />
        </div>
      </template>
    </div>

    <div v-if="thumbs && images.length > 1" ref="thumbRow" class="gal__thumbs">
      <button
        v-for="(src, i) in images" :key="src" type="button"
        class="gal__thumb" :class="{ 'is-on': i === index }"
        :aria-current="i === index" @click="go(i)"
      >
        <span class="visually-hidden">Bild {{ i + 1 }} zeigen</span>
        <NuxtImg :src="src" alt="" width="150" height="150" loading="lazy" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.gal { display: grid; gap: var(--s-3); height: 100%; }
.gal__stage { position: relative; height: 100%; min-height: 0; overflow: hidden; }

.gal__track {
  display: flex; height: 100%;
  overflow-x: auto; overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.gal__track::-webkit-scrollbar { display: none; }
.gal__slide {
  flex: 0 0 100%; height: 100%;
  overflow: hidden;
  scroll-snap-align: start;
}
.gal__img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: 50% 50%;
}

.gal__btn {
  position: absolute; top: 50%; translate: 0 -50%;
  display: grid; place-items: center;
  width: 2.25rem; height: 2.25rem; border-radius: 50%;
  color: var(--c-text);
  background: rgb(255 255 255 / 0.88);
  box-shadow: 0 2px 10px rgb(23 23 26 / 0.15);
  opacity: 0;
  transition: opacity var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out),
              color var(--d-fast) var(--e-out);
  z-index: 2;
}
.gal__btn--prev { left: var(--s-3); }
.gal__btn--next { right: var(--s-3); }
.gal__btn:hover { background: var(--c-gold); color: #FFFFFF; }
.gal__flip { transform: scaleX(-1); }
/* Pfeile erst beim Hovern, mit Tastatur und auf Touch-Geraeten immer. */
.gal:hover .gal__btn,
.gal__btn:focus-visible,
.gal--thumbs .gal__btn { opacity: 1; }
@media (hover: none) { .gal__btn { opacity: 1; } }

.gal__dots {
  position: absolute; bottom: var(--s-3); inset-inline: 0;
  display: flex; justify-content: center; gap: 6px;
  pointer-events: none;
}
.gal__dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgb(255 255 255 / 0.7);
  box-shadow: 0 0 0 1px rgb(23 23 26 / 0.15);
  transition: background var(--d-fast) var(--e-out), width var(--d-base) var(--e-out);
}
.gal__dots span.is-on { width: 16px; border-radius: 3px; background: var(--c-gold); }

.gal__thumbs {
  display: flex; gap: var(--s-2);
  overflow-x: auto; scrollbar-width: thin;
  padding-bottom: 2px;
}
.gal__thumb {
  flex: none; width: 4.5rem; aspect-ratio: 1 / 1; overflow: hidden;
  border: 1px solid var(--c-gold-hair); border-radius: var(--r-sm);
  opacity: 0.6;
  transition: opacity var(--d-fast) var(--e-out), border-color var(--d-fast) var(--e-out);
}
.gal__thumb img { width: 100%; height: 100%; object-fit: cover; }
.gal__thumb:hover { opacity: 1; }
.gal__thumb.is-on { opacity: 1; border-color: var(--c-gold); }
</style>
