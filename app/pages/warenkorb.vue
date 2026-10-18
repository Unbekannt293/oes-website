<script setup lang="ts">
import type { CartLine } from '~~/shared/types'
import { findPackage } from '~~/shared/catalog'
import { formatPrice, rentalDays } from '~~/shared/pricing'

// Warenkorb: eine Karte pro Buchung (Hauptposition mit ihrem Zubehoer), mit
// Foto, Datum und Preis. Lieferkosten gibt es hier bewusst noch nicht, die
// berechnet erst die Kasse anhand der Adresse.
useSeoMeta({ title: 'Warenkorb', robots: 'noindex, follow' })

const { lines, loaded, subtotal, deposit, remove } = useCart()

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
  <div class="section shell">
    <nav class="crumbs label" aria-label="Brotkrumen">
      <NuxtLink to="/">Startseite</NuxtLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page" class="crumbs__here">Warenkorb</span>
    </nav>
    <h1 class="display h-col wk__title">Ihr Warenkorb</h1>

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
      <ul class="wk__list">
        <li v-for="b in bookings" :key="b.main.group" class="wk__card">
          <NuxtLink :to="linkFor(b.main)" class="wk__media" tabindex="-1" aria-hidden="true">
            <NuxtImg :src="photo(b.main)" alt="" width="320" height="320" class="wk__img" />
          </NuxtLink>

          <div class="wk__body">
            <div class="wk__head">
              <div>
                <h2 class="wk__name">
                  <NuxtLink :to="linkFor(b.main)">{{ b.main.name }}</NuxtLink>
                </h2>
                <p class="wk__spec">{{ spec(b.main) }}</p>
              </div>
              <p class="wk__price">{{ formatPrice(b.totalCents) }}</p>
            </div>

            <p class="wk__date">
              <UiIcon name="calendar" :size="15" /> {{ dates(b.main) }}
            </p>

            <ul v-if="b.addons.length" class="wk__addons">
              <li v-for="a in b.addons" :key="a.id">
                <span>+ {{ a.name }}</span>
                <span class="wk__addon-price">{{ formatPrice(a.unitPriceCents * a.quantity) }}</span>
                <button type="button" class="wk__x" @click="remove(a.id)">
                  <UiIcon name="close" :size="14" />
                  <span class="visually-hidden">{{ a.name }} entfernen</span>
                </button>
              </li>
            </ul>

            <button type="button" class="label wk__remove" @click="remove(b.main.id)">
              <UiIcon name="close" :size="13" /> Entfernen
            </button>
          </div>
        </li>
      </ul>

      <aside class="wk__sum">
        <p class="label wk__sum-h">Bestellübersicht</p>
        <dl>
          <div v-for="b in bookings" :key="b.main.group" class="muted">
            <dt>{{ b.main.name }}</dt><dd>{{ formatPrice(b.totalCents) }}</dd>
          </div>
          <div class="wk__total"><dt>Zwischensumme</dt><dd>{{ formatPrice(subtotal) }}</dd></div>
          <div class="muted"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
        </dl>
        <p class="wk__note muted">
          <UiIcon name="info" :size="14" />
          Lieferkosten berechnen wir an der Kasse anhand Ihrer Adresse.
          Die Kaution erhalten Sie nach der Veranstaltung zurück.
        </p>
        <UiButton variant="solid" size="lg" class="wk__btn" disabled>Zur Kasse</UiButton>
        <p class="wk__note wk__note--plain muted">
          Die Online-Kasse folgt in Kürze. Bis dahin
          <NuxtLink to="/kontakt">fragen Sie Ihre Auswahl gern direkt an</NuxtLink>.
        </p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.crumbs { display: flex; gap: var(--s-2); margin-bottom: var(--s-5); color: var(--c-text-muted); }
.crumbs a:hover { color: var(--c-gold); }
.crumbs__here { color: var(--c-gold); }
.wk__title { margin-bottom: var(--s-7); }
.wk__wait { min-height: 40vh; }

.wk { display: grid; gap: var(--s-7); align-items: start; }
@media (min-width: 960px) { .wk { grid-template-columns: minmax(0, 1fr) 360px; } }

/* ---- Karten: Foto links, Angaben rechts (wie die Produktkarten, quer) ---- */
.wk__list { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-4); }
.wk__card {
  display: grid; grid-template-columns: 7.5rem minmax(0, 1fr);
  background: var(--c-paper-pure);
  border: var(--border-hair); border-radius: var(--r-md);
  overflow: hidden;
}
@media (min-width: 640px) { .wk__card { grid-template-columns: 11rem minmax(0, 1fr); } }
.wk__media { display: block; background: #0B0A09; }
.wk__img { width: 100%; height: 100%; min-height: 100%; object-fit: cover; aspect-ratio: 1; }

.wk__body { display: grid; align-content: start; gap: var(--s-2); padding: var(--s-4) var(--s-4) var(--s-3); }
@media (min-width: 640px) { .wk__body { padding: var(--s-5) var(--s-5) var(--s-4); } }
.wk__head { display: flex; justify-content: space-between; align-items: start; gap: var(--s-3); }
.wk__name { font-size: 1.05rem; font-weight: 600; line-height: 1.3; }
.wk__name a:hover { color: var(--c-gold); }
.wk__spec { font-size: var(--t-small); color: var(--c-text-muted); }
.wk__price { font-weight: 600; white-space: nowrap; color: var(--c-gold); font-variant-numeric: tabular-nums; }
.wk__date { display: flex; align-items: center; gap: 0.4rem; font-size: var(--t-small); }
.wk__date svg { color: var(--c-gold); flex: none; }

.wk__addons { list-style: none; padding: var(--s-2) 0 0; margin: 0; display: grid; gap: 0.15rem; border-top: 1px solid var(--c-gold-hair); font-size: 0.8125rem; color: var(--c-text-muted); }
.wk__addons li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: var(--s-2); }
.wk__addon-price { font-variant-numeric: tabular-nums; }
.wk__x {
  display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%;
  color: var(--c-text-muted);
  transition: color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.wk__x:hover { color: var(--c-danger); background: rgb(192 57 43 / 0.08); }

.wk__remove {
  justify-self: start; display: inline-flex; align-items: center; gap: 0.3rem;
  margin-top: var(--s-1); padding: 0.25rem 0;
  font-size: 0.6875rem; color: var(--c-text-muted);
  transition: color var(--d-fast) var(--e-out);
}
.wk__remove:hover { color: var(--c-danger); }

/* Handy: kleines Vorschaubild statt Foto ueber die ganze Kartenhoehe,
   Preis unter dem Namen, damit der Text Platz hat. */
@media (max-width: 639px) {
  .wk__card { grid-template-columns: 5.5rem minmax(0, 1fr); gap: var(--s-3); padding: var(--s-3); }
  .wk__media { align-self: start; border-radius: var(--r-sm); overflow: hidden; }
  .wk__body { padding: 0; }
  .wk__head { flex-direction: column; gap: 0.1rem; }
  .wk__price { order: 3; margin-top: var(--s-1); }
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
