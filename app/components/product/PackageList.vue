<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { printsLabel } from '~~/shared/catalog'
import { cheapestWithSoundboxCents, formatPrice } from '~~/shared/pricing'

// Die Fotobox-Pakete als Preisliste, so wie Louis sie selbst fuehrt: eine
// Zeile pro Paket, Name, Leistungen, Preis. Zwei Arten:
//   mit `to`     jede Zeile ist ein Link (Pakete-Seite, Produktuebersicht)
//   ohne `to`    jede Zeile waehlt das Paket aus (Produktseite, "select")
const { packages, selected = '', to } = defineProps<{
  packages: RentalPackage[]
  selected?: string
  to?: (pkg: RentalPackage) => string
}>()
const emit = defineEmits<{ select: [slug: string] }>()
// Als Text ('NuxtLink') findet <component :is> die Komponente nicht.
const NuxtLink = resolveComponent('NuxtLink')

function details(p: RentalPackage) {
  return [
    printsLabel(p),
    p.designIncluded ? 'Fotodesign inklusive' : null,
    `Lieferung bis ${p.freeDeliveryKm} km inklusive`,
  ].filter(Boolean).join(' · ')
}
</script>

<template>
  <ol class="pl">
    <li v-for="p in packages" :key="p.slug">
      <component
        :is="to ? NuxtLink : 'button'"
        :to="to ? to(p) : undefined"
        :type="to ? undefined : 'button'"
        :aria-pressed="to ? undefined : selected === p.slug"
        class="pl__row" :class="{ 'is-sel': selected === p.slug }"
        @click="to ? undefined : emit('select', p.slug)"
      >
        <span class="pl__name">
          <span class="display pl__short">{{ p.short }}</span>
          <span v-if="p.highlight" class="label pl__tag">Beliebt</span>
        </span>
        <span class="pl__details">{{ details(p) }}</span>
        <span class="pl__price">
          <span class="pl__amount">{{ formatPrice(p.priceCents) }}</span>
          <span v-if="cheapestWithSoundboxCents(p)" class="pl__alt">
            mit Soundbox ab {{ formatPrice(cheapestWithSoundboxCents(p)!) }}
          </span>
        </span>
        <span class="label pl__act" aria-hidden="true">
          <template v-if="to">Wählen <UiIcon name="arrow" :size="12" /></template>
          <template v-else>{{ selected === p.slug ? 'Gewählt' : 'Wählen' }}</template>
        </span>
      </component>
    </li>
  </ol>
</template>

<style scoped>
.pl {
  list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--c-gold-hair);
  container-type: inline-size;
}
.pl li { border-bottom: 1px solid var(--c-gold-hair); }

.pl__row {
  display: grid; align-items: center; gap: var(--s-2) var(--s-5);
  grid-template-columns: minmax(8.5rem, auto) 1fr auto auto;
  width: 100%; padding: var(--s-4) var(--s-4) var(--s-4) var(--s-5);
  text-align: left; color: var(--c-text);
  border-left: 2px solid transparent;
  transition: background var(--d-fast) var(--e-out), border-color var(--d-fast) var(--e-out);
}
.pl__row:hover { background: rgb(195 139 55 / 0.05); }
.pl__row.is-sel { background: rgb(195 139 55 / 0.08); border-left-color: var(--c-gold); }

.pl__name { display: flex; align-items: baseline; gap: var(--s-2); }
.pl__short { font-size: 1.6rem; line-height: 1.1; }
.pl__tag { color: var(--c-gold); font-size: 0.625rem; }

.pl__details { font-size: var(--t-small); color: var(--c-text-muted); }

.pl__price { display: grid; justify-items: end; font-variant-numeric: tabular-nums; }
.pl__amount { font-size: 1.125rem; font-weight: 600; }
.pl__alt { font-size: 0.75rem; color: var(--c-text-muted); white-space: nowrap; }

.pl__act {
  display: inline-flex; align-items: center; gap: 0.3rem;
  min-width: 4.5rem; justify-content: flex-end;
  color: var(--c-gold);
}
.pl__row.is-sel .pl__act { color: var(--c-text); }

/* Schmal: Leistungen unter den Namen, Preis rechts daneben. Haengt an der
   Breite der Liste, nicht des Fensters: auf der Produktseite steht sie in
   einer Spalte neben dem Buchungskasten. */
@container (max-width: 640px) {
  .pl__row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'name price' 'details details' 'act act';
    padding-left: var(--s-4);
  }
  .pl__name { grid-area: name; flex-wrap: wrap; column-gap: var(--s-2); row-gap: 0; }
  .pl__price { grid-area: price; }
  .pl__details { grid-area: details; }
  .pl__act { grid-area: act; justify-content: flex-start; min-width: 0; }
}
</style>
