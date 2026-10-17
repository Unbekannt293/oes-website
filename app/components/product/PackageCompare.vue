<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { addons, LAYOUT_ADDON } from '~~/shared/catalog'
import { formatPrice } from '~~/shared/pricing'

// "Was ist drin?": die Druckstufen nebeneinander, wie ein Tarifvergleich.
// Bewusst ohne Wochentags- oder Kombipreise, die rechnet der Buchungskasten
// fuer das gewaehlte Datum aus. Mit `selectable` waehlt ein Klick auf den
// Spaltenkopf die Stufe (Produktseite), die gewaehlte Spalte ist markiert.
const { packages, selected = '', selectable = false } = defineProps<{
  packages: RentalPackage[]
  selected?: string
  selectable?: boolean
}>()
const emit = defineEmits<{ select: [slug: string] }>()

const layoutPrice = addons.find(a => a.slug === LAYOUT_ADDON)!.priceCents
</script>

<template>
  <div class="cmp" role="region" aria-label="Pakete im Vergleich" tabindex="0">
    <table class="cmp__table">
      <thead>
        <tr>
          <td />
          <th
            v-for="p in packages" :key="p.slug" scope="col"
            :class="{ 'is-sel': selected === p.slug }"
          >
            <button
              v-if="selectable" type="button" class="cmp__head"
              :aria-pressed="selected === p.slug" @click="emit('select', p.slug)"
            >
              <span class="label">{{ p.short }}</span>
              <span v-if="p.highlight" class="cmp__tag">Beliebt</span>
            </button>
            <span v-else class="cmp__head">
              <span class="label">{{ p.short }}</span>
              <span v-if="p.highlight" class="cmp__tag">Beliebt</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Ausdrucke</th>
          <td v-for="p in packages" :key="p.slug" :class="{ 'is-sel': selected === p.slug }">
            <span v-if="p.prints" class="cmp__num">{{ p.prints }}</span>
            <span v-else class="cmp__off">nur digital</span>
          </td>
        </tr>
        <tr>
          <th scope="row">Online-Galerie</th>
          <td v-for="p in packages" :key="p.slug" :class="{ 'is-sel': selected === p.slug }">
            <UiIcon name="check" :size="16" class="cmp__yes" /><span class="visually-hidden">ja</span>
          </td>
        </tr>
        <tr>
          <th scope="row">Eigenes Fotodesign</th>
          <td v-for="p in packages" :key="p.slug" :class="{ 'is-sel': selected === p.slug }">
            <template v-if="p.designIncluded">
              <UiIcon name="check" :size="16" class="cmp__yes" /><span class="visually-hidden">inklusive</span>
            </template>
            <span v-else class="cmp__off">+ {{ formatPrice(layoutPrice) }}</span>
          </td>
        </tr>
        <tr>
          <th scope="row">Lieferung frei bis</th>
          <td v-for="p in packages" :key="p.slug" :class="{ 'is-sel': selected === p.slug }">
            {{ p.freeDeliveryKm }} km
          </td>
        </tr>
        <tr class="cmp__price">
          <th scope="row">Preis</th>
          <td v-for="p in packages" :key="p.slug" :class="{ 'is-sel': selected === p.slug }">
            {{ formatPrice(p.priceCents) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Auf dem Handy seitlich wischbar, die Zeilennamen bleiben stehen. */
.cmp { overflow-x: auto; min-width: 0; max-width: 100%; }
.cmp__table {
  width: 100%; min-width: 34rem;
  border-collapse: collapse;
  font-size: var(--t-small);
  font-variant-numeric: tabular-nums;
}
.cmp__table th, .cmp__table td {
  padding: var(--s-3) var(--s-2);
  text-align: center; white-space: nowrap;
  border-bottom: 1px solid var(--c-gold-hair);
}
.cmp__table tbody th {
  position: sticky; left: 0; z-index: 1;
  text-align: left; font-weight: 500; color: var(--c-text-muted);
  padding-left: 0; background: var(--c-paper);
}
.cmp__table thead td { position: sticky; left: 0; background: var(--c-paper); }

.cmp__head {
  display: grid; justify-items: center; gap: 0.15rem;
  width: 100%; padding: var(--s-2) 0;
  color: var(--c-text);
}
button.cmp__head { cursor: pointer; border-radius: var(--r-sm); }
button.cmp__head:hover { color: var(--c-gold); }
.cmp__tag { font-size: 0.625rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-gold); }

.cmp__num { font-size: 1.05rem; font-weight: 600; }
.cmp__off { color: var(--c-text-muted); }
.cmp__yes { display: inline-block; color: var(--c-gold); vertical-align: middle; }
.cmp__price td { font-weight: 600; color: var(--c-text); }

/* Gewaehlte Stufe: Spalte leicht getoent, Kopf in Gold. */
.cmp__table .is-sel { background: rgb(195 139 55 / 0.08); }
.cmp__table th.is-sel .cmp__head { color: var(--c-gold); }
</style>
