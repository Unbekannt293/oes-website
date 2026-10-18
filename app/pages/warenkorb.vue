<script setup lang="ts">
import { formatPrice } from '~~/shared/pricing'

// Erste Fassung: Positionen ansehen und entfernen, Summe und Kaution.
// Adresse, Lieferkosten (quoteDelivery) und Kasse folgen nach Louis' Mockup.
useSeoMeta({ title: 'Warenkorb', robots: 'noindex, follow' })

const { lines, loaded, subtotal, deposit, remove } = useCart()

function dates(from: string, to: string) {
  return from === to ? formatEventDate(from) : `${formatEventDate(from)} bis ${formatEventDate(to)}`
}
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
        <li v-for="l in lines" :key="l.id" class="wk__line" :class="{ 'wk__line--addon': l.kind === 'addon' }">
          <div class="wk__what">
            <p class="wk__name">
              <span v-if="l.quantity > 1">{{ l.quantity }} × </span>{{ l.name }}
            </p>
            <p class="wk__meta muted">
              <template v-if="l.detail">{{ l.detail }} · </template>{{ dates(l.from, l.to) }}
            </p>
          </div>
          <p class="wk__price">{{ formatPrice(l.unitPriceCents * l.quantity) }}</p>
          <button
            type="button" class="wk__remove" @click="remove(l.id)"
          >
            <UiIcon name="close" :size="16" />
            <span class="visually-hidden">{{ l.name }} entfernen</span>
          </button>
        </li>
      </ul>

      <aside class="wk__sum">
        <p class="label wk__sum-h">Bestellübersicht</p>
        <dl>
          <div><dt>Zwischensumme</dt><dd>{{ formatPrice(subtotal) }}</dd></div>
          <div class="muted"><dt>Lieferung</dt><dd>nach Adresse</dd></div>
          <div class="wk__total"><dt>Gesamt</dt><dd>{{ formatPrice(subtotal) }}</dd></div>
          <div class="muted"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
        </dl>
        <p class="wk__note muted">
          <UiIcon name="info" :size="14" />
          Die Kaution erhalten Sie nach der Veranstaltung zurück. Die Lieferkosten
          berechnen wir anhand Ihrer Adresse.
        </p>
        <UiButton variant="solid" size="lg" class="wk__btn" disabled>Zur Kasse</UiButton>
        <p class="wk__note muted">
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

.wk__list { list-style: none; padding: 0; border-top: 1px solid var(--c-gold-hair); }
.wk__line {
  display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: var(--s-4);
  padding: var(--s-5) 0;
  border-bottom: 1px solid var(--c-gold-hair);
}
/* Zubehoer haengt sichtbar an seiner Hauptposition. */
.wk__line--addon { padding-left: var(--s-6); padding-block: var(--s-3); border-bottom-style: dashed; }
.wk__name { font-weight: 600; }
.wk__line--addon .wk__name { font-weight: 400; font-size: var(--t-small); }
.wk__meta { font-size: var(--t-small); }
.wk__price { font-weight: 600; white-space: nowrap; }
.wk__remove {
  display: grid; place-items: center;
  width: 2.25rem; height: 2.25rem; border-radius: 50%;
  color: var(--c-text-muted);
  transition: color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out);
}
.wk__remove:hover { color: var(--c-danger); background: rgb(192 57 43 / 0.08); }

.wk__sum {
  display: grid; gap: var(--s-4);
  padding: var(--s-6) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.wk__sum-h { color: var(--c-text); }
.wk__sum dl { display: grid; gap: var(--s-2); margin: 0; font-size: var(--t-small); }
.wk__sum dl > div { display: flex; justify-content: space-between; gap: var(--s-3); }
.wk__sum dd { margin: 0; }
.wk__total { font-size: 1.1rem; font-weight: 600; padding-top: var(--s-2); border-top: 1px solid var(--c-gold-hair); }
.wk__total dd { color: var(--c-gold); }
.wk__note { display: flex; gap: 0.4rem; align-items: start; font-size: 0.8125rem; line-height: 1.5; }
.wk__note svg { flex: none; margin-top: 0.15rem; }
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
