<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { addons, LAYOUT_ADDON } from '~~/shared/catalog'
import { formatPrice } from '~~/shared/pricing'

// Die Druckstufen im Vergleich. Jede Stufe ist eine Spalte, die sich wie eine
// Produktkarte verhaelt: beim Ueberfahren hebt sie sich an, die gewaehlte
// bleibt hervorgehoben. Die Zeilen bleiben ueber Spalten hinweg buendig
// (grid + subgrid). Ist wenig Platz (Handy, Container-Abfrage), werden die
// Spalten zu Karten untereinander, jede mit ihren Vorteilen als Liste.
// Ohne Wochentags- oder Kombipreise, die rechnet der Buchungskasten.
//   to       jede Spalte ist ein Link (Pakete-Seite)
//   sonst    jede Spalte waehlt die Stufe aus (Produktseite, "select")
const { packages, selected = '', to } = defineProps<{
  packages: RentalPackage[]
  selected?: string
  to?: (pkg: RentalPackage) => string
}>()
const emit = defineEmits<{ select: [slug: string] }>()
const NuxtLink = resolveComponent('NuxtLink')

const layoutPrice = addons.find(a => a.slug === LAYOUT_ADDON)!.priceCents
const prints = (p: RentalPackage) => (p.prints ? `${p.prints} Ausdrucke` : 'Nur digital')
const aria = (p: RentalPackage) => [
  p.short, prints(p), 'Online-Galerie',
  p.designIncluded ? 'Fotodesign inklusive' : `Fotodesign für ${formatPrice(layoutPrice)}`,
  `Lieferung frei bis ${p.freeDeliveryKm} km`, formatPrice(p.priceCents),
].join(', ')
</script>

<template>
  <div class="cmp-wrap">
    <div class="cmp" :style="{ '--n': packages.length }">
      <div class="cmp__labels" aria-hidden="true">
        <span class="cmp__cell cmp__cell--head" />
        <span class="cmp__cell">Ausdrucke</span>
        <span class="cmp__cell">Online-Galerie</span>
        <span class="cmp__cell">Eigenes Fotodesign</span>
        <span class="cmp__cell">Lieferung frei bis</span>
        <span class="cmp__cell">Preis</span>
      </div>

      <component
        :is="to ? NuxtLink : 'button'"
        v-for="p in packages" :key="p.slug"
        :to="to ? to(p) : undefined"
        :type="to ? undefined : 'button'"
        :aria-pressed="to ? undefined : selected === p.slug"
        :aria-label="aria(p)"
        class="cmp__col" :class="{ 'is-sel': selected === p.slug }"
        @click="to ? undefined : emit('select', p.slug)"
      >
        <span class="cmp__cell cmp__cell--head label">{{ p.short }}</span>
        <span class="cmp__cell cmp__cell--prints">
          <template v-if="p.prints"><span class="cmp__num">{{ p.prints }}</span><span class="cmp__m">&nbsp;Ausdrucke</span></template>
          <span v-else class="cmp__off">Nur digital</span>
        </span>
        <span class="cmp__cell cmp__cell--perk">
          <UiIcon name="check" :size="16" class="cmp__yes" /><span class="cmp__m">Online-Galerie</span>
        </span>
        <span class="cmp__cell cmp__cell--perk">
          <template v-if="p.designIncluded">
            <UiIcon name="check" :size="16" class="cmp__yes" /><span class="cmp__m">Fotodesign inklusive</span>
          </template>
          <template v-else>
            <span class="cmp__gap cmp__m" /><span class="cmp__off"><span class="cmp__m">Fotodesign&nbsp;</span>+ {{ formatPrice(layoutPrice) }}</span>
          </template>
        </span>
        <span class="cmp__cell cmp__cell--perk">
          <UiIcon name="check" :size="16" class="cmp__yes cmp__m" /><span><span class="cmp__m">Lieferung frei bis&nbsp;</span>{{ p.freeDeliveryKm }} km</span>
        </span>
        <span class="cmp__cell cmp__cell--price">{{ formatPrice(p.priceCents) }}</span>
      </component>
    </div>
  </div>
</template>

<style scoped>
.cmp-wrap { container-type: inline-size; }

/* ---- Schmal (Handy): Karten untereinander ---- */
.cmp { display: grid; gap: var(--s-3); }
.cmp__labels { display: none; }
.cmp__col {
  display: grid; grid-template-columns: 1fr auto; align-items: baseline;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-4) var(--s-5);
  text-align: left; color: var(--c-text);
  background: var(--c-paper-pure);
  border: var(--border-hair); border-radius: var(--r-md);
  transition: transform var(--d-base) var(--e-out), box-shadow var(--d-base) var(--e-out),
              border-color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.cmp__col:hover { transform: translateY(-3px); box-shadow: var(--shadow-card); }
.cmp__col:focus-visible { outline: 2px solid var(--c-gold); outline-offset: 3px; }
.cmp__col.is-sel { border-color: var(--c-gold); box-shadow: inset 0 0 0 1px var(--c-gold); }

.cmp__cell { font-size: var(--t-small); }
.cmp__cell--head { grid-column: 1; grid-row: 1; color: var(--c-text); }
.cmp__cell--price { grid-column: 2; grid-row: 1; font-size: 1.05rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.cmp__cell--prints { grid-column: 1 / -1; font-size: 1rem; margin-bottom: var(--s-1); }
.cmp__cell--perk { grid-column: 1 / -1; display: flex; align-items: center; gap: 0.4rem; color: var(--c-text-muted); }
.cmp__num { font-weight: 600; }
.cmp__off { color: var(--c-text-muted); }
.cmp__yes { display: inline-block; flex: none; color: var(--c-gold); }
/* Platzhalter in Hakenbreite, damit Zeilen ohne Haken buendig bleiben. */
.cmp__gap { display: inline-block; flex: none; width: 16px; }
.cmp__col.is-sel .cmp__cell--head { color: var(--c-gold); }

/* ---- Breit: Spalten nebeneinander, Zeilen buendig per subgrid ---- */
@container (min-width: 40rem) {
  .cmp {
    grid-template-columns: minmax(8.5rem, auto) repeat(var(--n), minmax(0, 1fr));
    grid-template-rows: repeat(6, auto);
    gap: 0 var(--s-2);
  }
  .cmp__labels, .cmp__col {
    grid-row: 1 / -1;
    display: grid; grid-template-rows: subgrid; grid-template-columns: none;
    gap: 0;
  }
  .cmp__labels { color: var(--c-text-muted); }
  .cmp__col {
    padding: 0 var(--s-2);
    background: transparent; border-color: transparent;
    text-align: center;
  }
  /* Ueberfahren oder gewaehlt: die Spalte wird zur Karte, wie in der Produktuebersicht. */
  .cmp__col:hover, .cmp__col.is-sel { background: var(--c-paper-pure); border-color: var(--c-gold-hair); }
  .cmp__col:hover { transform: translateY(-4px); box-shadow: var(--shadow-card); }
  .cmp__col.is-sel { border-color: var(--c-gold); box-shadow: inset 0 0 0 1px var(--c-gold); }
  .cmp__col.is-sel:hover { box-shadow: inset 0 0 0 1px var(--c-gold), var(--shadow-card); }

  .cmp__cell {
    grid-column: auto; grid-row: auto; margin: 0;
    display: flex; align-items: center; justify-content: center;
    padding: var(--s-3) 0; min-height: 3rem;
    border-bottom: 1px solid var(--c-gold-hair);
    white-space: nowrap; color: inherit;
  }
  .cmp__labels .cmp__cell { justify-content: flex-start; font-weight: 500; }
  .cmp__cell:last-child { border-bottom: 0; }
  .cmp__cell--head { padding-top: var(--s-4); }
  .cmp__cell--prints { font-size: 1.05rem; }
  .cmp__cell--price { font-size: var(--t-small); font-weight: 600; }
  /* Kurze Beschriftungen braucht nur die Kartenansicht auf dem Handy. */
  .cmp__m { display: none; }
}
</style>
