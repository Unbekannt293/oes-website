<script setup lang="ts">
import type { CartLine } from '~~/shared/types'
import { findPackage } from '~~/shared/catalog'
import { formatPrice, rentalDays } from '~~/shared/pricing'

// Warenkorb: eine Karte pro Buchung (Hauptposition mit ihrem Zubehoer), mit
// Foto, Datum und Preis. Lieferkosten gibt es hier bewusst noch nicht, die
// berechnet erst die Kasse anhand der Adresse.
useSeoMeta({ title: 'Warenkorb', robots: 'noindex, follow' })

const { lines, loaded, kaution, subtotal, deposit, remove } = useCart()

interface Booking { main: CartLine, addons: CartLine[], totalCents: number }
/** Zeilen nach Buchung buendeln, Reihenfolge wie hinzugefuegt. */
const bookings = computed<Booking[]>(() => {
  const map = new Map<string, Booking>()
  for (const l of lines.value) {
    const b = map.get(l.group)
    if (l.kind !== 'addon' && !b) map.set(l.group, { main: l, addons: [], totalCents: 0 })
    else if (b) b.addons.push(l)
  }
  for (const b of map.values()) {
    b.totalCents = [b.main, ...b.addons].reduce((s, l) => s + l.unitPriceCents * l.quantity, 0)
  }
  return [...map.values()]
})

/** Foto passend zur Auswahl: Fotobox allein, mit 1 oder 2 Soundboxen, Soundbox einzeln oder doppelt. */
function photo(l: CartLine) {
  if (l.kind === 'package') {
    const sb = l.deposit?.soundboxes ?? 0
    return sb === 2 ? '/images/produkte/set-fotobox-zwei-soundboxen-drucker.webp'
      : sb === 1 ? '/images/produkte/set-fotobox-soundbox-drucker.webp'
        : '/images/produkte/fotobox-oes.webp'
  }
  return l.quantity > 1 ? '/images/produkte/soundbox-doppel-1.webp' : '/images/produkte/soundbox-front.webp'
}

/** Zweite Zeile unter dem Namen, z. B. "300 Ausdrucke · mit 1 Soundbox". */
function spec(l: CartLine) {
  if (l.kind === 'package') {
    const p = findPackage(l.slug)
    const prints = p ? (p.prints ? `${p.prints} Ausdrucke` : 'Nur digital') : ''
    const sb = l.deposit?.soundboxes ?? 0
    return [prints, sb ? `mit ${sb} Soundbox${sb > 1 ? 'en' : ''}` : 'ohne Soundbox'].filter(Boolean).join(' · ')
  }
  return `${l.quantity} Stück`
}

function dates(l: CartLine) {
  const days = rentalDays(l.from, l.to)
  return l.from === l.to
    ? formatEventDate(l.from)
    : `${formatEventDate(l.from)} bis ${formatEventDate(l.to)} · ${days} Tage`
}
const linkFor = (l: CartLine) => (l.kind === 'package' ? '/produkte/fotobox' : `/produkte/${l.slug}`)
</script>

<template>
  <div>
  <PageHero crumb="Warenkorb" title="Ihr Warenkorb" slim />
  <div class="section shell wk__page">

    <!-- Bis der gespeicherte Korb geladen ist, nichts zeigen statt kurz "leer". -->
    <div v-if="!loaded" class="wk__wait" aria-hidden="true" />

    <div v-else-if="!lines.length" class="wk__empty">
      <span class="wk__empty-icon"><UiIcon name="cart" :size="28" /></span>
      <p class="display wk__empty-h">Ihr Warenkorb ist noch leer.</p>
      <p class="muted">Stellen Sie sich Ihr Event aus Fotobox, Soundbox und Paketen zusammen.</p>
      <div class="wk__empty-btns">
        <UiButton to="/pakete" variant="solid">Pakete ansehen</UiButton>
        <UiButton to="/produkte" variant="light">Produkte ansehen</UiButton>
      </div>
    </div>

    <div v-else class="wk">
      <!-- Eine grosse Karte wie bei Amazon: Kopfzeile, die Buchungen als
           Zeilen mit Trennlinien, unten rechts die Zwischensumme. -->
      <section class="wk__box" aria-label="Positionen">
        <div class="wk__boxhead label">
          <span>{{ bookings.length }} {{ bookings.length === 1 ? 'Buchung' : 'Buchungen' }}</span>
          <span>Preis</span>
        </div>

        <ul class="wk__list">
          <li v-for="b in bookings" :key="b.main.group" class="wk__item">
            <NuxtLink :to="linkFor(b.main)" class="wk__media" tabindex="-1" aria-hidden="true">
              <NuxtImg :src="photo(b.main)" alt="" width="320" height="320" class="wk__img" />
            </NuxtLink>

            <div class="wk__body">
              <h2 class="wk__name">
                <NuxtLink :to="linkFor(b.main)">{{ b.main.name }}</NuxtLink>
              </h2>
              <!-- Handy: Preis direkt unter dem Namen (breit steht er rechts). -->
              <p class="wk__price wk__price--inline">{{ formatPrice(b.totalCents) }}</p>
              <p class="wk__spec">{{ spec(b.main) }}</p>
              <p class="wk__date">
                <UiIcon name="calendar" :size="15" /> {{ dates(b.main) }}
              </p>

              <ul v-if="b.addons.length" class="wk__addons">
                <li v-for="a in b.addons" :key="a.id">
                  <span>+ {{ a.name }}</span>
                  <span class="wk__addon-price">{{ formatPrice(a.unitPriceCents * a.quantity) }}</span>
                  <button type="button" class="wk__del wk__del--sm" @click="remove(a.id)">
                    <UiIcon name="minus" :size="16" />
                    <span class="visually-hidden">{{ a.name }} entfernen</span>
                  </button>
                </li>
              </ul>

              <button type="button" class="label wk__remove" @click="remove(b.main.id)">
                <UiIcon name="trash" :size="16" /> Entfernen
                <span class="visually-hidden">: {{ b.main.name }}</span>
              </button>
            </div>

            <p class="wk__price wk__price--side">{{ formatPrice(b.totalCents) }}</p>
          </li>
        </ul>

        <p class="wk__boxfoot">
          Zwischensumme ({{ bookings.length }} {{ bookings.length === 1 ? 'Buchung' : 'Buchungen' }}):
          <strong>{{ formatPrice(subtotal) }}</strong>
        </p>
      </section>

      <aside class="wk__sum">
        <p class="label wk__sum-h">Bestellübersicht</p>
        <dl>
          <div class="wk__total"><dt>Zwischensumme</dt><dd>{{ formatPrice(subtotal) }}</dd></div>
          <div class="muted"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
        </dl>

        <!-- Kaution nie online: Kartengebuehren bekaeme Louis nicht zurueck. -->
        <div v-if="deposit" class="wk__kaution" role="radiogroup" aria-labelledby="kaution-h">
          <p id="kaution-h" class="label wk__kaution-h">Kaution zahlen</p>
          <label class="wk__kopt" :class="{ 'is-sel': kaution === 'bar' }">
            <input v-model="kaution" type="radio" name="kaution" value="bar">
            <span>Bar bei der Übergabe</span>
          </label>
          <label class="wk__kopt" :class="{ 'is-sel': kaution === 'ueberweisung' }">
            <input v-model="kaution" type="radio" name="kaution" value="ueberweisung">
            <span>Per Überweisung vorab</span>
          </label>
        </div>

        <p class="wk__note muted">
          <UiIcon name="info" :size="14" />
          Lieferkosten berechnen wir an der Kasse anhand Ihrer Adresse.
          Die Kaution erhalten Sie nach der Rückgabe zurück.
        </p>
        <UiButton to="/kasse" variant="solid" size="lg" class="wk__btn">Zur Kasse</UiButton>
      </aside>
    </div>
  </div>
  </div>
</template>

<style scoped>
.wk__page { padding-top: var(--s-7); }
.wk__wait { min-height: 40vh; }

.wk { display: grid; gap: var(--s-7); align-items: start; }
@media (min-width: 960px) { .wk { grid-template-columns: minmax(0, 1fr) 360px; } }

/* ---- Eine grosse Karte, Buchungen als Zeilen ---- */
.wk__box {
  padding: var(--s-4) var(--s-5) var(--s-5);
  background: var(--c-paper-pure);
  border: var(--border-hair); border-radius: var(--r-md);
}
.wk__boxhead {
  display: flex; justify-content: space-between;
  padding-bottom: var(--s-3);
  color: var(--c-text-muted); border-bottom: 1px solid var(--c-gold-hair);
}
.wk__list { list-style: none; padding: 0; margin: 0; }
.wk__item {
  display: grid; grid-template-columns: 9rem minmax(0, 1fr) auto; gap: var(--s-5);
  padding: var(--s-5) 0;
  border-bottom: 1px solid var(--c-gold-hair);
}
.wk__media { display: block; align-self: start; border-radius: var(--r-sm); overflow: hidden; background: #0B0A09; }
.wk__img { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; }

.wk__body { display: grid; align-content: start; justify-items: start; gap: var(--s-1); min-width: 0; }
.wk__name { font-size: 1.1rem; font-weight: 600; line-height: 1.3; }
.wk__name a:hover { color: var(--c-gold); }
.wk__spec { font-size: var(--t-small); color: var(--c-text-muted); }
.wk__date { display: flex; align-items: center; gap: 0.4rem; margin-top: var(--s-1); font-size: var(--t-small); }
.wk__date svg { color: var(--c-gold); flex: none; }
.wk__price { font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; text-align: right; }

.wk__addons {
  list-style: none; padding: var(--s-2) 0 0; margin: var(--s-2) 0 0; width: 100%; max-width: 26rem;
  display: grid; gap: 0.1rem;
  border-top: 1px dashed var(--c-gold-hair);
  font-size: 0.8125rem; color: var(--c-text-muted);
}
.wk__addons li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: var(--s-2); }
.wk__addon-price { font-variant-numeric: tabular-nums; }

/* Buchung entfernen: Papierkorb mit Wort, rot. */
.wk__remove {
  display: inline-flex; align-items: center; gap: 0.35rem;
  margin-top: var(--s-2); padding: 0.3rem 0;
  font-size: 0.6875rem; color: var(--c-danger);
  transition: opacity var(--d-fast) var(--e-out);
}
.wk__remove:hover { opacity: 0.7; }
/* Optischer Ausgleich: der Papierkorb hat seine Masse unten (Korpus), der
   Text sitzt rechnerisch mittig, wirkt aber zu hoch. Icon 1px anheben. */
.wk__remove { line-height: 1; }
.wk__remove svg { transform: translateY(-1px); }

/* Zubehoer entfernen: Minus, rot beim Ueberfahren. */
.wk__del {
  display: grid; place-items: center; width: 2.25rem; height: 2.25rem;
  margin-top: var(--s-2); margin-left: -0.5rem;
  border-radius: 50%; color: var(--c-text-muted);
  transition: color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.wk__del--sm { width: 1.75rem; height: 1.75rem; margin: 0; }
.wk__del:hover { color: var(--c-danger); background: rgb(192 57 43 / 0.08); }

.wk__boxfoot { padding-top: var(--s-4); text-align: right; font-size: 1.05rem; }
.wk__boxfoot strong { font-variant-numeric: tabular-nums; }

/* Handy: kleineres Bild, Preis unter den Angaben. */
.wk__price--inline { display: none; }
@media (max-width: 639px) {
  .wk__box { padding: var(--s-3) var(--s-4) var(--s-4); }
  .wk__boxhead span:last-child { display: none; }
  .wk__item { grid-template-columns: 5.5rem minmax(0, 1fr); gap: var(--s-3); padding: var(--s-4) 0; }
  .wk__price--side { display: none; }
  .wk__price--inline { display: block; text-align: left; color: var(--c-gold); }
  .wk__name { font-size: 1rem; }
  .wk__addons { grid-template-columns: none; }
  .wk__boxfoot { font-size: 0.9375rem; }
}

/* ---- Uebersicht ---- */
.wk__sum {
  display: grid; gap: var(--s-4);
  padding: var(--s-6) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.wk__sum-h { color: var(--c-text); }
.wk__sum dl { display: grid; gap: var(--s-2); margin: 0; font-size: var(--t-small); }
.wk__sum dl > div { display: flex; justify-content: space-between; gap: var(--s-3); }
.wk__sum dd { margin: 0; white-space: nowrap; }
.wk__total { font-size: 1.1rem; font-weight: 600; padding-top: var(--s-2); border-top: 1px solid var(--c-gold-hair); }
.wk__total dd { color: var(--c-gold); }
.wk__note { display: flex; gap: 0.4rem; align-items: start; font-size: 0.8125rem; line-height: 1.5; }
.wk__note svg { flex: none; margin-top: 0.15rem; }
.wk__note--plain { display: block; }

.wk__kaution { display: grid; gap: var(--s-2); }
.wk__kaution-h { color: var(--c-text); font-size: 0.6875rem; }
.wk__kopt {
  display: flex; align-items: center; gap: var(--s-3);
  padding: var(--s-2) var(--s-3); font-size: var(--t-small);
  border: 1px solid var(--c-gold-hair); border-radius: var(--r-sm); cursor: pointer;
  transition: border-color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.wk__kopt input { accent-color: var(--c-gold); }
.wk__kopt:hover { border-color: var(--c-gold); }
.wk__kopt.is-sel { border-color: var(--c-gold); background: rgb(195 139 55 / 0.08); }

.wk__note a { color: var(--c-text); text-decoration: underline; text-underline-offset: 2px; }
.wk__btn { width: 100%; }

.wk__empty {
  display: grid; justify-items: center; gap: var(--s-3); text-align: center;
  padding: var(--s-9) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.wk__empty-icon {
  display: grid; place-items: center;
  width: 4rem; height: 4rem; border-radius: 50%;
  color: var(--c-gold); border: 1px solid var(--c-gold-hair);
}
.wk__empty-h { font-size: var(--t-h3); }
.wk__empty-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s-3); margin-top: var(--s-3); }
</style>
