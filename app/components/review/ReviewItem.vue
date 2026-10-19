<script setup lang="ts">
import { BEZUEGE, type Bewertung } from '~~/shared/bewertungen'

// Eine Bewertung wie in Louis' Entwurf: Initialen im Kreis, Name, Sterne,
// Datum, rechts das Produkt als Etikett, darunter der Text.
const { b, mitBezug = true } = defineProps<{ b: Bewertung, mitBezug?: boolean }>()
// Feste Zeitzone: der Server rendert in UTC, der Browser in deutscher Zeit.
// Ohne sie zeigt eine Bewertung von kurz nach Mitternacht beim Hydrieren
// ein anderes Datum als vom Server geliefert.
const datum = computed(() => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(b.erstellt_am)))
const initialen = computed(() => b.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join(''))
</script>

<template>
  <article class="ri">
    <header class="ri__head">
      <span class="ri__avatar" aria-hidden="true">{{ initialen }}</span>
      <div class="ri__who">
        <p class="ri__name">{{ b.name }}</p>
        <p class="ri__meta">
          <ReviewStars :value="b.sterne" :size="14" />
          <span class="muted">{{ datum }}</span>
        </p>
      </div>
      <span v-if="mitBezug" class="ri__tag">{{ b.bezug ? BEZUEGE[b.bezug] : 'OES allgemein' }}</span>
    </header>
    <p class="ri__text">{{ b.text }}</p>
  </article>
</template>

<style scoped>
.ri { display: grid; gap: var(--s-3); }
.ri__head { display: flex; align-items: center; gap: var(--s-3); }
.ri__avatar {
  display: grid; place-items: center; flex: none;
  width: 2.75rem; height: 2.75rem; border-radius: 50%;
  border: 1px solid var(--c-gold); color: var(--c-gold);
  font-weight: 600; font-size: 0.95rem; letter-spacing: 0.02em;
}
.ri__who { display: grid; gap: 0.15rem; min-width: 0; }
.ri__name { font-weight: 600; }
/* Darf umbrechen: in schmalen Karten passt das Datum sonst nicht neben die Sterne. */
.ri__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.15rem var(--s-3); font-size: var(--t-small); }
.ri__tag {
  margin-left: auto; align-self: start; flex: none;
  padding: 0.2rem 0.6rem; border: 1px solid var(--c-gold); border-radius: var(--r-sm);
  color: var(--c-gold); font-size: 0.75rem; white-space: nowrap;
}
.ri__text { line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }
@media (max-width: 480px) {
  .ri__head { flex-wrap: wrap; }
  .ri__tag { margin-left: calc(2.75rem + var(--s-3)); }
}
</style>
