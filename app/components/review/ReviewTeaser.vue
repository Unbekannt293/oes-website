<script setup lang="ts">
import { formatSchnitt, THEMEN, type Thema, zusammenfassung } from '~~/shared/bewertungen'

// Startseite unter den Produkten: Kundenbewertungen mit Schnitt und einer
// Bewertung, die alle 10 Sekunden wechselt, wenn es mehrere gibt (Lukas,
// 19.10.2026). Ein beschriftetes Dropdown sagt klar, worum es geht:
// "Bewertungen zu: Alle Produkte" (Standard), Fotobox, Soundbox, Komplettpakete.
const WECHSEL_MS = 10_000

const { zumThema } = useBewertungen()
const { oeffnen } = useBewertungDialog()
const thema = ref<Thema | null>(null)
const themaText = computed(() => (thema.value ? THEMEN[thema.value] : 'allen Produkten'))
const liste = zumThema(thema)
const sum = computed(() => zusammenfassung(liste.value))

// Auf dem Server und beim ersten Bild immer die neueste, gewechselt wird
// erst im Browser. Mit der Maus darueber oder Fokus darin bleibt sie stehen.
const index = ref(0)
const pause = ref(false)
const aktuell = computed(() => liste.value[index.value % Math.max(liste.value.length, 1)])
watch(thema, () => { index.value = 0 })
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (!pause.value && liste.value.length > 1) index.value = (index.value + 1) % liste.value.length
  }, WECHSEL_MS)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="rt" aria-labelledby="rt-h">
    <header class="rt__head">
      <h2 id="rt-h" class="display rt__h">Kundenbewertungen</h2>
      <label class="rt__filter">
        <span class="label rt__filter-l">Bewertungen zu</span>
        <select v-model="thema" class="control rt__sel">
          <option :value="null">Alle Produkte</option>
          <option v-for="(label, key) in THEMEN" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
    </header>

    <button type="button" class="rt__sum" @click="oeffnen({ thema })">
      <span v-if="sum.anzahl" class="rt__avg">{{ formatSchnitt(sum.schnitt) }}</span>
      <span class="rt__sum-r">
        <ReviewStars :value="sum.schnitt" :size="18" />
        <span class="muted">
          {{ sum.anzahl ? `${sum.anzahl === 1 ? '1 Bewertung' : `${sum.anzahl} Bewertungen`} zu ${themaText}` : `Noch keine Bewertungen zu ${themaText}` }}
        </span>
      </span>
    </button>

    <div v-if="aktuell" class="rt__quote-wrap" @mouseenter="pause = true" @mouseleave="pause = false" @focusin="pause = true" @focusout="pause = false">
      <Transition name="rt-fade" mode="out-in">
        <blockquote :key="aktuell.id" class="rt__quote">
          <p>„{{ aktuell.text }}“</p>
          <footer class="muted">{{ aktuell.name }}</footer>
        </blockquote>
      </Transition>
      <div v-if="liste.length > 1" class="rt__dots">
        <button
          v-for="(b, i) in liste.slice(0, 8)" :key="b.id" type="button" class="rt__dot"
          :aria-label="`Bewertung ${i + 1} von ${liste.length}`" :aria-current="i === index % liste.length"
          @click="index = i"
        />
      </div>
    </div>

    <div class="rt__btns">
      <UiButton variant="solid" size="sm" @click="oeffnen({ thema, schreiben: true })">Bewertung schreiben</UiButton>
      <UiButton variant="light" size="sm" @click="oeffnen({ thema })">Alle Bewertungen</UiButton>
    </div>
  </section>
</template>

<style scoped>
.rt {
  display: grid; gap: var(--s-4); align-content: start;
  padding: var(--s-6) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.rt__head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: var(--s-3) var(--s-5); }
.rt__h { font-size: var(--t-h3); }
.rt__filter { display: grid; gap: 0.3rem; }
.rt__filter-l { color: var(--c-text-muted); font-size: var(--t-label); }
.rt__sel { width: auto; min-width: 13rem; padding-block: 0.5rem; }
.rt__sum { display: flex; align-items: center; gap: var(--s-4); text-align: left; cursor: pointer; }
.rt__avg { font-size: 2.4rem; font-weight: 700; line-height: 1; }
.rt__sum-r { display: grid; gap: 0.2rem; font-size: var(--t-small); }
.rt__quote { margin: 0; font-size: var(--t-small); line-height: 1.55; padding-left: var(--s-4); border-left: 2px solid var(--c-gold-hair); }
.rt__quote p { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rt__quote footer { margin-top: var(--s-1); }
.rt__quote-wrap { display: grid; gap: var(--s-3); }
.rt__dots { display: flex; gap: 0.35rem; padding-left: var(--s-4); }
.rt__dot { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: var(--c-gold-hair); transition: background var(--d-fast) var(--e-out); }
.rt__dot[aria-current='true'] { background: var(--c-gold); }
.rt-fade-enter-active, .rt-fade-leave-active { transition: opacity 0.4s var(--e-out); }
.rt-fade-enter-from, .rt-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .rt-fade-enter-active, .rt-fade-leave-active { transition: none; }
}
.rt__btns { display: flex; flex-wrap: wrap; gap: var(--s-3); margin-top: auto; }
</style>
