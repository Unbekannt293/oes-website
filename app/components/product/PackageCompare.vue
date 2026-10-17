<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { addons, LAYOUT_ADDON } from '~~/shared/catalog'
import { formatPrice } from '~~/shared/pricing'

// Die Druckstufen im Vergleich. Jede Stufe ist eine Spalte, die sich wie eine
// Produktkarte verhaelt: beim Ueberfahren hebt sie sich an, die gewaehlte
// bleibt hervorgehoben. Die Zeilen bleiben ueber Spalten hinweg buendig
// (grid + subgrid). Ist wenig Platz (Handy, Buchungskasten; Container-
// Abfrage), wird daraus ein Karussell: eine Karte mit allen Vorteilen,
// Pfeile und Punkte zum Blaettern, die naechste Karte schaut am Rand hervor.
// Ohne Wochentags- oder Kombipreise, die rechnet der Buchungskasten.
//   to       jede Spalte ist ein Link (Pakete-Seite)
//   sonst    jede Spalte waehlt die Stufe aus (Produktseite, Buchungskasten)
//   days     Preis fuer so viele Tage (Buchungskasten mit Zeitraum)
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
  p.short, prints(p), 'Online-Galerie',
  p.designIncluded ? 'Fotodesign inklusive' : `Fotodesign für ${formatPrice(layoutPrice)}`,
  `Lieferung frei bis ${p.freeDeliveryKm} km`, formatPrice(p.priceCents * days),
].join(', ')

// ---- Karussell (nur schmal sichtbar, breit sind die Pfeile ausgeblendet) ----
const track = ref<HTMLElement | null>(null)
const current = ref(0)

function cards() {
  return track.value ? [...track.value.querySelectorAll<HTMLElement>('.cmp__col')] : []
}
function go(i: number) {
  const list = cards()
  const card = list[Math.max(0, Math.min(i, list.length - 1))]
  if (!card || !track.value) return
  track.value.scrollTo({ left: card.offsetLeft - track.value.offsetLeft - parseFloat(getComputedStyle(track.value).paddingLeft), behavior: 'smooth' })
}
// Welche Karte gerade vorn ist: die, deren linke Kante am naechsten liegt.
function onScroll() {
  const t = track.value
  if (!t) return
  const left = t.getBoundingClientRect().left
  let best = 0, dist = Infinity
  cards().forEach((c, i) => {
    const d = Math.abs(c.getBoundingClientRect().left - left)
    if (d < dist) { dist = d; best = i }
  })
  current.value = best
}
// Gewaehlte Stufe beim Laden zeigen (z. B. ?paket=fotobox-premium).
onMounted(() => {
  const i = packages.findIndex(p => p.slug === selected)
  if (i > 0 && track.value) {
    const card = cards()[i]
    if (card) track.value.scrollLeft = card.offsetLeft - track.value.offsetLeft
    onScroll()
  }
})
</script>

<template>
  <div class="cmp-wrap">
    <div ref="track" class="cmp" :style="{ '--n': packages.length }" @scroll.passive="onScroll">
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
        <span class="cmp__cell cmp__cell--price">
          {{ formatPrice(p.priceCents * days) }}
          <small v-if="days > 1" class="cmp__per">{{ days }} × {{ formatPrice(p.priceCents) }}</small>
        </span>
        <!-- Nur im Karussell: macht klar, dass die Karte klickbar ist. -->
        <span class="cmp__act label" aria-hidden="true">
          <template v-if="to">Buchen <UiIcon name="arrow" :size="14" /></template>
          <template v-else-if="selected === p.slug"><UiIcon name="check" :size="14" /> Ausgewählt</template>
          <template v-else>Auswählen</template>
        </span>
      </component>
    </div>

    <div class="cmp__nav">
      <button type="button" class="cmp__arrow" :disabled="current === 0" aria-label="Vorheriges Paket" @click="go(current - 1)">
        <UiIcon name="arrow" :size="16" class="cmp__back" />
      </button>
      <div class="cmp__dots">
        <button
          v-for="(p, i) in packages" :key="p.slug" type="button"
          class="cmp__dot" :class="{ 'is-on': i === current }"
          :aria-label="`Paket ${p.short}`" :aria-current="i === current" @click="go(i)"
        />
      </div>
      <button type="button" class="cmp__arrow" :disabled="current === packages.length - 1" aria-label="Nächstes Paket" @click="go(current + 1)">
        <UiIcon name="arrow" :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.cmp-wrap { container-type: inline-size; }

/* ---- Schmal: Karussell, eine Karte vorn, die naechste schaut hervor ---- */
.cmp {
  display: grid; grid-auto-flow: column; grid-auto-columns: 84%;
  gap: var(--s-3);
  overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
  /* Luft fuer Rahmen und Schatten, overflow schneidet sonst ab. */
  padding: 4px 4px 10px; margin: -4px -4px -10px;
  scroll-padding-inline: 4px;
}
.cmp::-webkit-scrollbar { display: none; }
.cmp__labels { display: none; }
.cmp__col {
  scroll-snap-align: start;
  display: grid; grid-template-columns: 1fr auto; align-items: baseline; align-content: start;
  gap: var(--s-2) var(--s-3);
  padding: var(--s-4) var(--s-5);
  text-align: left; color: var(--c-text);
  background: var(--c-paper-pure);
  border: 1px solid var(--c-gold-hair); border-radius: var(--r-md);
  transition: transform var(--d-base) var(--e-out), box-shadow var(--d-base) var(--e-out),
              border-color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.cmp__col:focus-visible { outline: 2px solid var(--c-gold); outline-offset: 2px; }
.cmp__col.is-sel { border-color: var(--c-gold); }

.cmp__cell { font-size: var(--t-small); }
.cmp__cell--head { grid-column: 1; grid-row: 1; color: var(--c-text); }
.cmp__cell--price { grid-column: 2; grid-row: 1; display: grid; justify-items: end; font-size: 1.05rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.cmp__per { font-size: 0.75rem; font-weight: 400; color: var(--c-text-muted); }
.cmp__cell--prints { grid-column: 1 / -1; font-size: 1.05rem; }
.cmp__cell--perk { grid-column: 1 / -1; display: flex; align-items: center; gap: 0.4rem; color: var(--c-text-muted); }
.cmp__num { font-weight: 600; }
.cmp__off { color: var(--c-text-muted); }
.cmp__yes { display: inline-block; flex: none; color: var(--c-gold); }
/* Platzhalter in Hakenbreite, damit Zeilen ohne Haken buendig bleiben. */
.cmp__gap { display: inline-block; flex: none; width: 16px; }
.cmp__col.is-sel .cmp__cell--head { color: var(--c-gold); }
.cmp__act {
  grid-column: 1 / -1; margin-top: var(--s-2); padding-top: var(--s-3);
  display: flex; align-items: center; gap: 0.35rem;
  border-top: 1px solid var(--c-gold-hair); color: var(--c-gold);
}
.cmp__col.is-sel .cmp__act { color: var(--c-text); }

.cmp__nav { display: flex; align-items: center; justify-content: space-between; gap: var(--s-3); margin-top: var(--s-4); }
.cmp__arrow {
  display: grid; place-items: center; width: 2.25rem; height: 2.25rem; flex: none;
  border: 1px solid var(--c-gold-hair); border-radius: 50%; color: var(--c-text);
  transition: background var(--d-fast) var(--e-out), opacity var(--d-fast) var(--e-out);
}
.cmp__arrow:hover:not(:disabled) { background: rgb(195 139 55 / 0.12); }
.cmp__arrow:disabled { opacity: 0.3; cursor: default; }
.cmp__back { transform: scaleX(-1); }
.cmp__dots { display: flex; gap: 0.4rem; }
.cmp__dot { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--c-gold-hair); transition: width var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out); }
.cmp__dot.is-on { width: 1.25rem; background: var(--c-gold); }

/* ---- Breit: Spalten nebeneinander, Zeilen buendig per subgrid ---- */
@container (min-width: 40rem) {
  .cmp {
    grid-auto-flow: row; grid-auto-columns: auto;
    grid-template-columns: minmax(8.5rem, auto) repeat(var(--n), minmax(0, 1fr));
    grid-template-rows: repeat(6, auto);
    gap: 0 var(--s-2);
    overflow: visible; padding: 0; margin: 0;
  }
  .cmp__nav, .cmp__act { display: none; }
  .cmp__labels, .cmp__col {
    grid-row: 1 / -1;
    display: grid; grid-template-rows: subgrid; grid-template-columns: none;
    gap: 0;
  }
  .cmp__labels { color: var(--c-text-muted); }
  .cmp__col {
    min-width: 0; padding: 0 var(--s-2);
    background: transparent; border-color: transparent;
    text-align: center;
  }
  /* Ueberfahren oder gewaehlt: die Spalte wird zur Karte, wie in der Produktuebersicht. */
  .cmp__col:hover, .cmp__col.is-sel { background: var(--c-paper-pure); border-color: var(--c-gold-hair); }
  .cmp__col:hover { transform: translateY(-4px); box-shadow: var(--shadow-card); }
  .cmp__col.is-sel { border-color: var(--c-gold); }

  .cmp__cell {
    grid-column: auto; grid-row: auto; margin: 0;
    display: flex; align-items: center; justify-content: center;
    padding: var(--s-3) 0; min-height: 3rem;
    border-bottom: 1px solid var(--c-gold-hair);
    white-space: nowrap; color: inherit;
  }
  /* Lange Namen ("Premium Plus") duerfen umbrechen, statt die Spalte zu sprengen. */
  .cmp__cell--head { white-space: normal; text-align: center; line-height: 1.35; letter-spacing: 0.12em; }
  .cmp__labels .cmp__cell { justify-content: flex-start; font-weight: 500; }
  .cmp__cell--price, .cmp__labels .cmp__cell:last-child { border-bottom: 0; }
  .cmp__cell--head { padding-top: var(--s-4); }
  .cmp__cell--price { flex-direction: column; font-size: var(--t-small); font-weight: 600; }
  /* Kurze Beschriftungen braucht nur die Kartenansicht. */
  .cmp__m { display: none; }
}
</style>
