<script setup lang="ts">
import { BEZUEGE, type Bezug, formatSchnitt, vorschau, zusammenfassung } from '~~/shared/bewertungen'

// Bewertungen auf Produkt-, Produkte- und Pakete-Seite: Schnitt, eine
// Auswahl als Karten, Knopf zum Schreiben. Mit mehreren Bezuegen gibt es ein
// beschriftetes Dropdown "Bewertungen zu", jedes Produkt und jedes
// Komplettpaket hat seine eigenen Bewertungen.
// kompakt: neben dem Buchungskasten der Produktseite, kleinere Ueberschrift.
const { bezuege, kompakt = false } = defineProps<{ bezuege: Bezug[], kompakt?: boolean }>()
const { fuer } = useBewertungen()
const { oeffnen } = useBewertungDialog()

const wahl = ref<Bezug>(bezuege[0]!)
// Fotobox-Seite: der Bezug wechselt mit der Soundbox-Wahl im Buchungskasten.
watch(() => bezuege, (l) => { if (!l.includes(wahl.value)) wahl.value = l[0]! })

const liste = fuer(wahl)
const sum = computed(() => zusammenfassung(liste.value))
// Breit (Produkte, Pakete): vier nebeneinander. Neben dem Buchungskasten drei.
const karten = computed(() => vorschau(liste.value, kompakt ? 3 : 4))
// Gibt es mehr, zeigt eine Zeile unter den Karten, wie viele noch im Popup stehen.
const weitere = computed(() => liste.value.length - karten.value.length)
</script>

<template>
  <section class="rsec" :class="{ 'rsec--kompakt': kompakt }" aria-labelledby="rsec-h">
    <div class="rsec__head">
      <div class="rsec__title">
        <h2 id="rsec-h" class="display rsec__h">
          Bewertungen<template v-if="bezuege.length === 1"> zu {{ BEZUEGE[wahl] }}</template>
        </h2>
        <label v-if="bezuege.length > 1" class="rsec__filter">
          <span class="label rsec__filter-l">Bewertungen zu</span>
          <select v-model="wahl" class="control rsec__sel">
            <option v-for="b in bezuege" :key="b" :value="b">{{ BEZUEGE[b] }}</option>
          </select>
        </label>
        <p class="rsec__avg">
          <ReviewStars :value="sum.schnitt" :size="18" />
          <template v-if="sum.anzahl">
            <strong>{{ formatSchnitt(sum.schnitt) }}</strong>
            <span class="muted">· {{ sum.anzahl === 1 ? '1 Bewertung' : `${sum.anzahl} Bewertungen` }} zu {{ BEZUEGE[wahl] }}</span>
          </template>
          <span v-else class="muted">Noch keine Bewertungen</span>
        </p>
      </div>
      <div class="rsec__btns">
        <UiButton variant="solid" size="sm" @click="oeffnen({ bezug: wahl, schreiben: true })">Bewertung schreiben</UiButton>
        <UiButton variant="light" size="sm" @click="oeffnen({ bezug: wahl })">
          Alle {{ sum.anzahl > 1 ? `${sum.anzahl} ` : '' }}Bewertungen
        </UiButton>
      </div>
    </div>

    <div v-if="karten.length" class="rsec__grid">
      <ReviewItem v-for="b in karten" :key="b.id" :b="b" :mit-bezug="false" class="rsec__card" />
    </div>
    <button v-if="weitere > 0" type="button" class="rsec__more" @click="oeffnen({ bezug: wahl })">
      <span>+ {{ weitere === 1 ? '1 weitere Bewertung' : `${weitere} weitere Bewertungen` }}</span>
      <span class="rsec__more-link">Alle anzeigen <UiIcon name="arrow" :size="12" /></span>
    </button>
    <p v-else class="rsec__empty muted">
      Hier steht noch keine Bewertung. Wir freuen uns, wenn Sie die erste schreiben.
    </p>
  </section>
</template>

<style scoped>
.rsec { display: grid; gap: var(--s-6); }
.rsec__head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: var(--s-4) var(--s-6); }
.rsec__title { display: grid; gap: var(--s-3); }
.rsec__h { font-size: var(--t-h2); }
.rsec--kompakt .rsec__h { font-size: var(--t-h3); }
.rsec__filter { display: grid; gap: 0.3rem; }
.rsec__filter-l { color: var(--c-text-muted); font-size: 0.6875rem; }
.rsec__sel { width: auto; min-width: 14rem; padding-block: 0.5rem; }
.rsec__avg { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2); font-size: var(--t-small); }
.rsec__btns { display: flex; flex-wrap: wrap; gap: var(--s-3); }
.rsec__grid { display: grid; gap: var(--s-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); }
/* Breit: feste vier Spalten, auch wenn es erst eine Bewertung gibt. */
@media (min-width: 1100px) {
  .rsec:not(.rsec--kompakt) .rsec__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.rsec--kompakt .rsec__grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); }
/* Lange Texte in der Vorschau kuerzen, ganz stehen sie im Popup. */
.rsec__card :deep(.ri__text) { display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }
.rsec--kompakt { gap: var(--s-5); }
.rsec__card {
  padding: var(--s-5); align-content: start;
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.rsec__more {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s-2) var(--s-4);
  margin-top: calc(-1 * var(--s-2)); padding: var(--s-3);
  border: 1px dashed var(--c-gold-hair); border-radius: var(--r-md);
  font-size: var(--t-small); color: var(--c-text-muted); cursor: pointer;
  transition: border-color var(--d-fast) var(--e-out);
}
.rsec__more:hover { border-color: var(--c-gold); }
.rsec__more-link {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: var(--t-label); font-weight: 600; letter-spacing: var(--tr-label); text-transform: uppercase; color: var(--c-gold);
}
.rsec__empty {
  padding: var(--s-6) var(--s-5); text-align: center;
  background: var(--c-paper-pure); border: 1px dashed var(--c-gold-hair); border-radius: var(--r-md);
}
</style>
