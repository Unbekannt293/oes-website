<script setup lang="ts">
import { BEZUEGE, type Bewertung } from '~~/shared/bewertungen'

// Eine Bewertung wie in Louis' Entwurf: Initialen im Kreis, Name, Sterne,
// Datum, rechts das Produkt als Etikett, darunter der Text.
const { b, mitBezug = true } = defineProps<{ b: Bewertung, mitBezug?: boolean }>()
// Feste Zeitzone: der Server rendert in UTC, der Browser in deutscher Zeit.
// Ohne sie zeigt eine Bewertung von kurz nach Mitternacht beim Hydrieren
// ein anderes Datum als vom Server geliefert.
const datum = computed(() => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(b.erstellt_am)))
// Fotos wie bei Google: kleine Kacheln unter dem Text, antippen = gross.
const gross = ref<string | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
function zeigen(src: string) {
  gross.value = src
  nextTick(() => dialog.value?.showModal())
}
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
    <ul v-if="b.bilder?.length" class="ri__fotos">
      <li v-for="(src, i) in b.bilder" :key="src">
        <button type="button" class="ri__foto" :aria-label="`Foto ${i + 1} von ${b.name} vergrößern`" @click="zeigen(src)">
          <img :src="src" :alt="`Foto ${i + 1} von ${b.name}`" loading="lazy" decoding="async">
        </button>
      </li>
    </ul>
    <dialog ref="dialog" class="ri__gross" @click="dialog?.close()" @close="gross = null">
      <img v-if="gross" :src="gross" :alt="`Foto von ${b.name}`">
      <button type="button" class="ri__zu" aria-label="Schließen"><UiIcon name="close" :size="20" /></button>
    </dialog>
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
.ri__fotos { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-2); max-width: 22rem; }
.ri__foto { display: block; width: 100%; aspect-ratio: 1; border-radius: var(--r-sm); overflow: hidden; }
.ri__foto img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform var(--d-fast) var(--e-out); }
.ri__foto:hover img { transform: scale(1.04); }
.ri__gross {
  /* Der Reset nimmt Dialogen den Rand: so steht das Foto mittig im Fenster. */
  position: fixed; inset: 0; margin: auto; width: fit-content; height: fit-content;
  max-width: min(92vw, 1100px); max-height: 92vh; padding: 0; border: 0; background: transparent;
  overflow: visible; cursor: zoom-out;
}
.ri__gross::backdrop { background: rgb(0 0 0 / 0.85); }
.ri__gross img { display: block; max-width: min(92vw, 1100px); max-height: 92vh; border-radius: var(--r-sm); }
.ri__zu {
  position: absolute; top: 0.5rem; right: 0.5rem; display: grid; place-items: center;
  width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #FFFFFF; color: #111111;
}
@media (max-width: 480px) {
  .ri__head { flex-wrap: wrap; }
  .ri__tag { margin-left: calc(2.75rem + var(--s-3)); }
}
</style>
