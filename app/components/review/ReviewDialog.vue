<script setup lang="ts">
import { formatSchnitt, THEMEN, type Thema, zusammenfassung } from '~~/shared/bewertungen'

// Ein Popup fuer die ganze Seite (steht im Layout), Aufbau aus Louis'
// Entwurf (OES - Website.pdf): links Schnitt und alle Bewertungen mit
// Sortierung, rechts "Eigene Bewertung schreiben". Auf dem Handy
// untereinander, das Formular zuerst, wenn man ueber "Schreiben" kommt.
const { zustand } = useBewertungDialog()
const { zumThema } = useBewertungen()
const dlg = ref<{ oeffnen: () => void, schliessen: () => void } | null>(null)
const schreibBereich = ref<HTMLElement | null>(null)
const istOffen = ref(false)

const thema = computed({
  get: () => zustand.value.thema,
  set: (t: Thema | null) => { zustand.value.thema = t },
})
const sortierung = ref<'neu' | 'beste' | 'kritisch'>('neu')

const gefiltert = zumThema(thema)
const sum = computed(() => zusammenfassung(gefiltert.value))
const liste = computed(() => {
  const l = [...gefiltert.value]
  if (sortierung.value === 'beste') l.sort((a, b) => b.sterne - a.sterne)
  if (sortierung.value === 'kritisch') l.sort((a, b) => a.sterne - b.sterne)
  return l   // sort ist stabil: bei gleichen Sternen bleibt neueste zuerst
})

watch(() => zustand.value.offen, async (offen) => {
  if (offen && !istOffen.value) {
    dlg.value?.oeffnen()
    istOffen.value = true
    if (zustand.value.schreiben) {
      await nextTick()
      schreibBereich.value?.scrollIntoView({ block: 'start' })
    }
  }
  else if (!offen && istOffen.value) dlg.value?.schliessen()
})
function zu() {
  istOffen.value = false
  zustand.value.offen = false
}
</script>

<template>
  <UiDialog ref="dlg" :polster="false" breite="64rem" titel-id="rd-h" @zu="zu">
    <div class="rd__box" :class="{ 'rd--schreiben': zustand.schreiben }">
      <section class="rd__list-col" aria-labelledby="rd-h">
        <h2 id="rd-h" class="display rd__h">Kundenbewertungen</h2>

        <div class="rd__sum">
          <p class="rd__avg">{{ sum.anzahl ? formatSchnitt(sum.schnitt) : '–' }}</p>
          <ReviewStars :value="sum.schnitt" :size="22" />
          <p class="rd__avg-txt">
            <template v-if="sum.anzahl">{{ formatSchnitt(sum.schnitt) }} von 5 Sternen<br></template>
            <span class="muted">{{ sum.anzahl === 1 ? '1 Bewertung' : `${sum.anzahl} Bewertungen` }}</span>
          </p>
        </div>

        <div class="rd__ctrl">
          <label class="visually-hidden" for="rd-thema">Thema</label>
          <select id="rd-thema" v-model="thema" class="control rd__sel">
            <option :value="null">Alle Themen</option>
            <option v-for="(label, key) in THEMEN" :key="key" :value="key">{{ label }}</option>
          </select>
          <label class="visually-hidden" for="rd-sort">Sortierung</label>
          <select id="rd-sort" v-model="sortierung" class="control rd__sel">
            <option value="neu">Neueste zuerst</option>
            <option value="beste">Beste zuerst</option>
            <option value="kritisch">Kritischste zuerst</option>
          </select>
        </div>

        <p class="label rd__all">Alle Bewertungen</p>
        <div v-if="liste.length" class="rd__list" tabindex="0" aria-label="Bewertungen">
          <ReviewItem v-for="b in liste" :key="b.id" :b="b" class="rd__card" />
        </div>
        <p v-else class="rd__empty muted">Hier steht noch keine Bewertung. Schreiben Sie gern die erste!</p>
      </section>

      <section ref="schreibBereich" class="rd__write" aria-labelledby="rd-write-h">
        <h3 id="rd-write-h" class="display rd__h rd__h--sm">Eigene Bewertung schreiben</h3>
        <p class="muted rd__write-sub">Teilen Sie Ihre Erfahrung mit OES.</p>
        <ReviewForm :bezug="zustand.bezug" />
      </section>
    </div>
  </UiDialog>
</template>

<style scoped>
.rd__box {
  display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  /* Feste Hoehe, damit die Liste darin scrollen kann. */
  grid-template-rows: minmax(0, 1fr); height: min(44rem, calc(90dvh - 3px));
  gap: var(--s-6); padding: var(--s-7) var(--s-6) var(--s-6);
  overflow: hidden; border-radius: inherit;
}
.rd__list-col { display: flex; flex-direction: column; min-height: 0; gap: var(--s-4); }
/* Dialog-Ueberschriften wie ueberall: .display, Haupttitel --t-h2, Unterteil --t-h3. */
.rd__h { font-size: var(--t-h2); line-height: 1.05; }
.rd__h--sm { font-size: var(--t-h3); }

.rd__sum { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3) var(--s-4); }
.rd__avg { font-size: 2.6rem; font-weight: 700; line-height: 1; }
.rd__avg-txt { font-size: var(--t-small); line-height: 1.45; }

.rd__ctrl { display: flex; flex-wrap: wrap; gap: var(--s-3); }
.rd__sel { width: auto; min-width: 11rem; padding-block: 0.5rem; }

.rd__all { margin-top: var(--s-2); color: var(--c-text); }
/* Nur die Liste scrollt, Kopf und Formular bleiben stehen. */
.rd__list {
  display: grid; gap: var(--s-3); align-content: start;
  overflow-y: auto; overscroll-behavior: contain; min-height: 0; flex: 1;
  padding-right: var(--s-2);
}
.rd__card { padding: var(--s-4) var(--s-5); border: var(--border-hair); border-radius: var(--r-md); }
.rd__empty { padding: var(--s-6) var(--s-4); text-align: center; border: 1px dashed var(--c-gold-hair); border-radius: var(--r-md); }

.rd__write {
  align-self: start; padding: var(--s-6) var(--s-5);
  background: var(--c-gold-tint); border-radius: var(--r-md);
  max-height: 100%; overflow-y: auto; overscroll-behavior: contain;
}
.rd__write-sub { font-size: var(--t-small); margin: var(--s-1) 0 var(--s-5); }

/* Handy: untereinander, das ganze Popup scrollt. */
@media (max-width: 859px) {
  .rd__box {
    grid-template-columns: minmax(0, 1fr); grid-template-rows: none;
    height: auto; max-height: calc(90dvh - 3px); overflow-y: auto; padding: var(--s-6) var(--s-4) var(--s-5);
  }
  .rd__list { overflow: visible; padding-right: 0; }
  .rd__write { max-height: none; overflow: visible; }
  .rd--schreiben .rd__write { order: -1; }
}
</style>
