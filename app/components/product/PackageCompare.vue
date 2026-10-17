<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { addons, LAYOUT_ADDON } from '~~/shared/catalog'
import { formatPrice } from '~~/shared/pricing'

// Die Druckstufen im Vergleich, immer als Tabelle: links die Zeilennamen,
// daneben je Stufe eine Spalte. Die Zeilen bleiben ueber alle Spalten
// buendig (grid + subgrid), so laesst sich Punkt fuer Punkt vergleichen.
//  - Breit: alle Spalten nebeneinander. Beim Ueberfahren hebt sich eine
//    Spalte wie eine Produktkarte, die gewaehlte bleibt hervorgehoben.
//  - Schmal (Handy, Buchungskasten; Container-Abfrage): Karussell. Die
//    Zeilennamen bleiben stehen, die Spalten laufen seitlich durch, gut zwei
//    sind zu sehen. Pfeile und Punkte zum Blaettern, der Preis steht dann
//    unter dem Namen.
// Ohne Wochentags- oder Kombipreise, die rechnet der Buchungskasten.
//   to       jede Spalte ist ein Link (Pakete-Seite)
//   sonst    jede Spalte waehlt die Stufe aus (Produktseite, Buchungskasten)
//   days     Preis fuer so viele Tage (Buchungskasten mit Zeitraum)
// Hintergrund der stehenden Zeilennamen: --cmp-bg (Standard Seitenhintergrund).
const { packages, selected = '', to, days = 1 } = defineProps<{
  packages: RentalPackage[]
  selected?: string
  to?: (pkg: RentalPackage) => string
  days?: number
}>()
const emit = defineEmits<{ select: [slug: string] }>()
const NuxtLink = resolveComponent('NuxtLink')

const layoutPrice = addons.find(a => a.slug === LAYOUT_ADDON)!.priceCents
const prints = (p: RentalPackage) => (p.prints ? `${p.prints} Ausdrucke` : 'Nur digital')
const aria = (p: RentalPackage) => [
  p.short, selected === p.slug ? 'ausgewählt' : '', prints(p), 'Online-Galerie',
  p.designIncluded ? 'Fotodesign inklusive' : `Fotodesign für ${formatPrice(layoutPrice)}`,
  `Lieferung frei bis ${p.freeDeliveryKm} km`, formatPrice(p.priceCents * days),
].filter(Boolean).join(', ')

// ---- Karussell (nur schmal sichtbar, breit sind die Pfeile ausgeblendet) ----
const track = ref<HTMLElement | null>(null)
const labels = ref<HTMLElement | null>(null)
// Es ist genau eine Paketspalte sichtbar: ihr Index steuert Punkte und Pfeile.
const current = ref(0)

function cols() {
  return track.value ? [...track.value.querySelectorAll<HTMLElement>('.cmp__col')] : []
}
/**
 * Spalte i direkt rechts neben die stehenden Zeilennamen schieben. Gerechnet
 * wird ab der ersten Spalte: die Position der Zeilennamen selbst taugt nicht,
 * sie wandert als sticky-Element beim Scrollen mit.
 */
function go(i: number, behavior: ScrollBehavior = 'smooth') {
  const list = cols()
  const col = list[Math.max(0, Math.min(i, list.length - 1))]
  if (!col || !list[0] || !track.value) return
  current.value = list.indexOf(col)
  track.value.scrollTo({ left: col.offsetLeft - list[0].offsetLeft, behavior })
}
function onScroll() {
  const t = track.value, l = labels.value
  if (!t || !l) return
  const edge = l.getBoundingClientRect().right
  let best = 0, dist = Infinity
  cols().forEach((c, i) => {
    const d = Math.abs(c.getBoundingClientRect().left - edge)
    if (d < dist) { dist = d; best = i }
  })
  current.value = best
}
// Gewaehlte Stufe beim Laden zeigen (z. B. ?paket=fotobox-premium).
onMounted(() => {
  const i = packages.findIndex(p => p.slug === selected)
  if (i > 0) go(i, 'instant')
  onScroll()
})
</script>

<template>
  <div class="cmp-wrap">
    <div class="cmp-stage">
    <div ref="track" class="cmp" :style="{ '--n': packages.length }" @scroll.passive="onScroll">
      <div ref="labels" class="cmp__labels" aria-hidden="true">
        <span class="cmp__cell cmp__cell--head" />
        <span class="cmp__cell">Ausdrucke</span>
        <span class="cmp__cell">Online-Galerie</span>
        <span class="cmp__cell">Eigenes Fotodesign</span>
        <span class="cmp__cell">Lieferung frei bis</span>
        <span class="cmp__cell cmp__cell--price">Preis</span>
        <span class="cmp__cell cmp__cell--act" />
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
        <span class="cmp__cell cmp__cell--head">
          <!-- Platz ist in jeder Spalte reserviert, damit nichts springt. -->
          <span v-if="!to" class="cmp__picked" aria-hidden="true"><UiIcon name="check" :size="12" /> Ausgewählt</span>
          <span class="label cmp__name">{{ p.short }}</span>
          <span class="cmp__hprice">{{ formatPrice(p.priceCents * days) }}</span>
        </span>
        <span class="cmp__cell">
          <span v-if="p.prints" class="cmp__num">{{ p.prints }}</span>
          <span v-else class="cmp__off">nur digital</span>
        </span>
        <span class="cmp__cell"><UiIcon name="check" :size="16" class="cmp__yes" /></span>
        <span class="cmp__cell">
          <UiIcon v-if="p.designIncluded" name="check" :size="16" class="cmp__yes" />
          <span v-else class="cmp__off">+ {{ formatPrice(layoutPrice) }}</span>
        </span>
        <span class="cmp__cell">{{ p.freeDeliveryKm }} km</span>
        <span class="cmp__cell cmp__cell--price">
          {{ formatPrice(p.priceCents * days) }}
          <small v-if="days > 1" class="cmp__per">{{ days }} × {{ formatPrice(p.priceCents) }}</small>
        </span>
        <!-- Nur im Karussell: macht klar, dass die Spalte klickbar ist. -->
        <span class="cmp__cell cmp__cell--act label" aria-hidden="true">
          <template v-if="to">Buchen <UiIcon name="arrow" :size="12" /></template>
          <template v-else-if="selected !== p.slug">Wählen</template>
        </span>
      </component>
    </div>

      <!-- Pfeile liegen auf der sichtbaren Paketkarte, links und rechts vom Namen. -->
      <button type="button" class="cmp__arrow cmp__arrow--prev" :disabled="current === 0" aria-label="Vorheriges Paket" @click="go(current - 1)">
        <UiIcon name="arrow" :size="14" class="cmp__back" />
      </button>
      <button type="button" class="cmp__arrow cmp__arrow--next" :disabled="current === packages.length - 1" aria-label="Nächstes Paket" @click="go(current + 1)">
        <UiIcon name="arrow" :size="14" />
      </button>
    </div>

    <div class="cmp__dots">
      <button
        v-for="(p, i) in packages" :key="p.slug" type="button"
        class="cmp__dot" :class="{ 'is-on': i === current }"
        :aria-label="`Paket ${p.short}`" :aria-current="i === current" @click="go(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.cmp-wrap { container-type: inline-size; --cmp-label-w: 6.5rem; }

/* ---- Grundform (beide Breiten): Tabelle aus Spalten, Zeilen per subgrid ---- */
.cmp {
  position: relative;
  display: grid; grid-template-rows: repeat(6, auto);
  gap: 0 var(--s-2);
}
.cmp__labels, .cmp__col {
  grid-row: 1 / -1;
  display: grid; grid-template-rows: subgrid;
}
.cmp__labels { color: var(--c-text-muted); }
.cmp__col {
  min-width: 0; padding: 0 var(--s-2);
  text-align: center; color: var(--c-text);
  border: 1px solid transparent; border-radius: var(--r-md);
  transition: transform var(--d-base) var(--e-out), box-shadow var(--d-base) var(--e-out),
              border-color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.cmp__col:focus-visible { outline: 2px solid var(--c-gold); outline-offset: 2px; }
/* Ueberfahren oder gewaehlt: die Spalte wird zur Karte, wie in der Produktuebersicht. */
.cmp__col:hover, .cmp__col.is-sel { background: var(--c-paper-pure); border-color: var(--c-gold-hair); }
.cmp__col.is-sel { border-color: var(--c-gold); }

.cmp__cell {
  display: flex; align-items: center; justify-content: center;
  padding: var(--s-3) 0; min-height: 3rem;
  font-size: var(--t-small);
  border-bottom: 1px solid var(--c-gold-hair);
  white-space: nowrap;
}
.cmp__labels .cmp__cell { justify-content: flex-start; font-weight: 500; white-space: normal; line-height: 1.3; }
.cmp__cell--head { flex-direction: column; justify-content: flex-end; gap: 0.15rem; padding-top: var(--s-4); white-space: normal; }
.cmp__cell--price, .cmp__cell--act { border-bottom: 0; }

/* "Ausgewaehlt" ueber dem Namen; in allen Spalten Platz, sichtbar nur in der gewaehlten. */
.cmp__picked {
  display: inline-flex; align-items: center; gap: 0.2rem;
  font-size: 0.625rem; font-weight: 600; color: var(--c-gold); white-space: nowrap;
  visibility: hidden;
}
.cmp__col.is-sel .cmp__picked { visibility: visible; }
.cmp__name { text-align: center; line-height: 1.35; letter-spacing: 0.12em; }
.cmp__col.is-sel .cmp__name { color: var(--c-gold); }

.cmp__num { font-size: 1.05rem; font-weight: 600; }
.cmp__off { color: var(--c-text-muted); }
.cmp__yes { display: inline-block; color: var(--c-gold); }
.cmp__cell--price { flex-direction: column; font-weight: 600; font-variant-numeric: tabular-nums; }
.cmp__labels .cmp__cell--price { flex-direction: row; font-weight: 500; }
.cmp__hprice { font-size: 0.875rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.cmp__per { font-size: 0.75rem; font-weight: 400; color: var(--c-text-muted); }
.cmp__cell--act { color: var(--c-gold); gap: 0.3rem; min-height: 2.5rem; font-size: 0.6875rem; }

.cmp-stage { position: relative; }
.cmp__arrow {
  position: absolute; z-index: 3; top: 1.6rem;
  display: grid; place-items: center; width: 2rem; height: 2rem;
  border: 1px solid var(--c-gold-hair); border-radius: 50%;
  color: var(--c-text); background: var(--c-paper-pure);
  transition: background var(--d-fast) var(--e-out), opacity var(--d-fast) var(--e-out);
}
/* Erster Pfeil am linken Rand der Karte, also hinter den Zeilennamen. */
.cmp__arrow--prev { left: calc(var(--cmp-label-w) + var(--s-2) + var(--s-2)); }
.cmp__arrow--next { right: var(--s-2); }
.cmp__arrow:hover:not(:disabled) { background: rgb(195 139 55 / 0.12); }
.cmp__arrow:disabled { opacity: 0.25; cursor: default; }
.cmp__back { transform: scaleX(-1); }
/* Punkte mittig unter der Karte, nicht unter der ganzen Breite. */
.cmp__dots {
  display: flex; justify-content: center; gap: 0.4rem;
  margin: var(--s-3) 0 0 calc(var(--cmp-label-w) + var(--s-2));
}
.cmp__dot { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--c-gold-hair); transition: width var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out); }
.cmp__dot.is-on { width: 1.25rem; background: var(--c-gold); }

/* ---- Schmal: Karussell, Zeilennamen bleiben links stehen ---- */
@container (max-width: 39.99rem) {
  .cmp {
    /* Genau eine Paketspalte sichtbar, sie fuellt den Platz neben den Zeilennamen. */
    grid-template-columns: var(--cmp-label-w) repeat(var(--n), calc(100cqw - var(--cmp-label-w) - var(--s-2)));
    overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
    scroll-padding-left: calc(var(--cmp-label-w) + var(--s-2));
    padding-bottom: 4px;
  }
  .cmp::-webkit-scrollbar { display: none; }
  .cmp__labels {
    position: sticky; left: 0; z-index: 2;
    background: var(--cmp-bg, var(--c-paper));
    /* Auch die Luecke zur ersten Spalte abdecken, sonst blitzt dort die
       weggescrollte Spalte durch. */
    box-shadow: var(--s-2) 0 0 var(--cmp-bg, var(--c-paper));
    font-size: 0.8125rem;
  }
  /* Die sichtbare Spalte ist immer als Karte gerahmt: das ist der Teil, der blaettert. */
  .cmp__col {
    scroll-snap-align: start; padding: 0 var(--s-3);
    background: var(--c-paper-pure); border-color: var(--c-gold-hair);
  }
  .cmp__col.is-sel { border-color: var(--c-gold); }
  /* Platz fuer die Pfeile links und rechts vom Namen. */
  .cmp__col .cmp__cell--head { padding-inline: 2.4rem; }
  .cmp__cell--price { display: none; }
  .cmp__labels .cmp__cell { font-size: 0.8125rem; }
}

/* ---- Breit: alle Spalten nebeneinander ---- */
@container (min-width: 40rem) {
  .cmp { grid-template-columns: minmax(8.5rem, auto) repeat(var(--n), minmax(0, 1fr)); }
  .cmp__arrow, .cmp__dots, .cmp__cell--act, .cmp__hprice { display: none; }
  .cmp__col:hover { transform: translateY(-4px); box-shadow: var(--shadow-card); }
}
</style>
