<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { cheapestWithSoundboxCents, formatPrice } from '~~/shared/pricing'

// Die Fotobox-Pakete als Karten in der Machart der Produktkarten: hell,
// linksbuendig, ohne Symbole. Blickfang ist das, was die Pakete wirklich
// unterscheidet, die Zahl der Ausdrucke. Zwei Arten:
//   mit `to`     jede Karte ist ein Link (Pakete-Seite, Produktuebersicht)
//   ohne `to`    jede Karte waehlt das Paket aus (Produktseite, "select")
const { packages, selected = '', to } = defineProps<{
  packages: RentalPackage[]
  selected?: string
  to?: (pkg: RentalPackage) => string
}>()
const emit = defineEmits<{ select: [slug: string] }>()
// Als Text ('NuxtLink') findet <component :is> die Komponente nicht.
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <ul class="pc">
    <li v-for="p in packages" :key="p.slug">
      <component
        :is="to ? NuxtLink : 'button'"
        :to="to ? to(p) : undefined"
        :type="to ? undefined : 'button'"
        :aria-pressed="to ? undefined : selected === p.slug"
        class="pc__card" :class="{ 'is-sel': selected === p.slug }"
        @click="to ? undefined : emit('select', p.slug)"
      >
        <span class="pc__top">
          <span class="label pc__tier">{{ p.short }}</span>
          <span v-if="p.highlight" class="label pc__tag">Beliebt</span>
        </span>

        <span class="pc__hero">
          <template v-if="p.prints">
            <span class="display pc__num">{{ p.prints }}</span>
            <span class="pc__unit">Ausdrucke</span>
          </template>
          <template v-else>
            <span class="display pc__num pc__num--word">Digital</span>
            <span class="pc__unit">ohne Drucker</span>
          </template>
        </span>

        <span class="pc__facts">
          <span>Online-Galerie</span>
          <span v-if="p.designIncluded">Fotodesign inklusive</span>
          <span>Lieferung bis {{ p.freeDeliveryKm }} km</span>
        </span>

        <span class="pc__foot">
          <span class="pc__price">{{ formatPrice(p.priceCents) }}</span>
          <span v-if="cheapestWithSoundboxCents(p)" class="pc__alt">
            mit Soundbox ab {{ formatPrice(cheapestWithSoundboxCents(p)!) }}
          </span>
          <span class="label pc__act" aria-hidden="true">
            <template v-if="to">Wählen <UiIcon name="arrow" :size="12" /></template>
            <template v-else>{{ selected === p.slug ? 'Gewählt' : 'Wählen' }}</template>
          </span>
        </span>
      </component>
    </li>
  </ul>
</template>

<style scoped>
/* Alle Pakete in einer Reihe. Reicht die Breite nicht (Handy, Spalte auf der
   Produktseite), wird die Reihe seitlich wischbar statt umzubrechen: fuenf
   Karten ergaeben sonst immer eine einzelne Karte in der letzten Zeile.
   Das Polster gibt dem Anheben beim Hover Platz, overflow schneidet sonst ab. */
.pc {
  list-style: none; margin: calc(-1 * var(--s-3)); padding: var(--s-3);
  display: grid; gap: var(--s-3);
  grid-auto-flow: column; grid-auto-columns: minmax(10rem, 1fr);
  overflow-x: auto; scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--s-3);
  scrollbar-width: thin;
}
.pc li { display: flex; scroll-snap-align: start; }

.pc__card {
  flex: 1;
  display: flex; flex-direction: column; gap: var(--s-4);
  padding: var(--s-5) var(--s-4) var(--s-4);
  text-align: left; color: var(--c-text);
  background: var(--c-paper-pure);
  border: var(--border-hair);
  border-radius: var(--r-md);
  transition: transform var(--d-base) var(--e-out), box-shadow var(--d-base) var(--e-out),
              border-color var(--d-fast) var(--e-out);
}
.pc__card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card); }
.pc__card:focus-visible { outline: 2px solid var(--c-gold); outline-offset: 3px; }
.pc__card.is-sel { border-color: var(--c-gold); box-shadow: inset 0 0 0 1px var(--c-gold); }

.pc__top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s-2); }
.pc__tier { color: var(--c-text); }
.pc__tag { color: var(--c-gold); font-size: 0.625rem; }

.pc__hero { display: grid; padding-bottom: var(--s-4); border-bottom: 1px solid var(--c-gold-hair); }
.pc__num { font-size: clamp(2.6rem, 2rem + 1.6vw, 3.4rem); line-height: 1; font-variant-numeric: lining-nums; }
.pc__num--word { font-size: clamp(2rem, 1.6rem + 1.2vw, 2.6rem); line-height: 1.3; }
.pc__unit { font-size: var(--t-small); color: var(--c-text-muted); }

.pc__facts { display: grid; gap: 0.3rem; font-size: var(--t-small); color: var(--c-text-muted); }

/* Preis immer unten, auch wenn eine Karte weniger Zeilen hat. */
.pc__foot { margin-top: auto; display: grid; gap: 0.15rem; padding-top: var(--s-2); }
.pc__price { font-size: 1.25rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.pc__alt { font-size: 0.75rem; color: var(--c-text-muted); }
.pc__act {
  display: inline-flex; align-items: center; gap: 0.3rem;
  margin-top: var(--s-3); color: var(--c-gold);
}
.pc__card.is-sel .pc__act { color: var(--c-text); }
</style>
