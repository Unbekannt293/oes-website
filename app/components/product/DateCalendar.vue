<script setup lang="ts">
// Monatskalender fuer den Veranstaltungstag oder einen Mietzeitraum.
//  - Fr bis So sind golden getoent: dort gilt der Wochenendpreis. So sieht
//    man den Unterschied, ohne dass ein Satz ihn erklaeren muss.
//  - Belegte Tage (zu wenig freie Geraete laut /api/verfuegbarkeit) sind
//    durchgestrichen und nicht waehlbar.
//  - range: Der erste Klick waehlt einen Tag (eintaegige Miete), ein Klick
//    auf einen spaeteren Tag macht daraus einen Zeitraum, jeder weitere
//    Klick beginnt neu.
// Nur im Browser rendern (ClientOnly): "heute" haengt von der Uhr ab.
const model = defineModel<string>({ default: '' })
/** Letzter Tag des Zeitraums (nur mit range). */
const to = defineModel<string>('to', { default: '' })
/** false, wenn im gewaehlten Tag/Zeitraum nicht genug Geraete frei sind. */
const ok = defineModel<boolean>('ok', { default: true })
const { min = '', fotobox = true, soundboxes = 0, range = false } = defineProps<{
  min?: string
  /** Wird die Fotobox gebraucht? (Soundbox-Miete: nein) */
  fotobox?: boolean
  soundboxes?: number
  range?: boolean
}>()

const iso = (d: Date) => d.toLocaleDateString('sv-SE')
const at = (s: string) => new Date(`${s}T12:00:00`) // mittags: keine Zeitzonen-Kippe
const firstOf = (s: string) => `${s.slice(0, 7)}-01`
function daysBetween(a: string, b: string) {
  const out: string[] = []
  for (const d = at(a); iso(d) <= b; d.setDate(d.getDate() + 1)) out.push(iso(d))
  return out
}

const today = iso(new Date())
const view = ref(firstOf(model.value || min || today))

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(at(view.value)))
const longDate = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

interface Day { iso: string, day: number, weekend: boolean }
const cells = computed<(Day | null)[]>(() => {
  const start = at(view.value)
  const y = start.getFullYear(), m = start.getMonth()
  const lead = (start.getDay() + 6) % 7 // Woche beginnt Montag
  const count = new Date(y, m + 1, 0).getDate()
  const out: (Day | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d++) {
    const date = new Date(y, m, d, 12)
    const dow = date.getDay()
    out.push({ iso: iso(date), day: d, weekend: dow === 0 || dow >= 5 })
  }
  return out
})

function shift(n: number) {
  const d = at(view.value)
  d.setMonth(d.getMonth() + n, 1)
  view.value = firstOf(iso(d))
}
const canPrev = computed(() => view.value > firstOf(min || today))

// Freie Geraete je Tag, pro Geraet. Fehlt ein Wert (API nicht erreichbar),
// gilt der Tag als frei: geprueft wird ohnehin noch einmal beim Buchen.
const frei = ref<Record<string, Record<string, number>>>({})
async function load() {
  const von = view.value
  const s = at(von)
  const bis = iso(new Date(s.getFullYear(), s.getMonth() + 1, 0, 12))
  const geraete = [...(fotobox ? ['fotobox'] : []), ...(soundboxes ? ['soundbox'] : [])]
  await Promise.all(geraete.map(async (geraet) => {
    try {
      const r = await $fetch<{ tage: { tag: string, frei: number }[] }>('/api/verfuegbarkeit', { query: { geraet, von, bis } })
      frei.value = { ...frei.value, [geraet]: { ...frei.value[geraet], ...Object.fromEntries(r.tage.map(t => [t.tag, t.frei])) } }
    }
    catch { /* siehe oben */ }
  }))
}
watch([view, () => soundboxes], load, { immediate: true })

function busy(day: string) {
  if (fotobox && (frei.value.fotobox?.[day] ?? 1) < 1) return true
  return soundboxes > 0 && (frei.value.soundbox?.[day] ?? soundboxes) < soundboxes
}
const past = (day: string) => day < (min || today)

function pick(day: string) {
  if (!range) { model.value = day; return }
  // Eintaegig gewaehlt und spaeterer Tag geklickt: Zeitraum bis dorthin,
  // sofern kein belegter Tag dazwischen liegt. Sonst neu beginnen.
  if (model.value && model.value === to.value && day > model.value
    && !daysBetween(model.value, day).some(busy)) {
    to.value = day
    return
  }
  model.value = day
  to.value = day
}

const end = computed(() => (range ? to.value : model.value))
const inRange = (day: string) => range && !!model.value && day > model.value && day < to.value
watchEffect(() => {
  ok.value = !model.value || !daysBetween(model.value, end.value || model.value).some(busy)
})
</script>

<template>
  <div class="cal">
    <div class="cal__nav">
      <button type="button" class="cal__arrow" :disabled="!canPrev" aria-label="Vorheriger Monat" @click="shift(-1)">
        <UiIcon name="arrow" :size="16" class="cal__back" />
      </button>
      <p class="cal__month" aria-live="polite">{{ monthLabel }}</p>
      <button type="button" class="cal__arrow" aria-label="Nächster Monat" @click="shift(1)">
        <UiIcon name="arrow" :size="16" />
      </button>
    </div>

    <div class="cal__grid" role="group" :aria-label="monthLabel">
      <span v-for="(w, i) in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']" :key="w" class="cal__dow" :class="{ 'is-we': i >= 4 }" aria-hidden="true">{{ w }}</span>
      <template v-for="(c, i) in cells" :key="c?.iso ?? `leer-${i}`">
        <span v-if="!c" />
        <button
          v-else type="button" class="cal__day"
          :class="{
            'is-we': c.weekend, 'is-busy': busy(c.iso), 'is-today': c.iso === today,
            'is-sel': c.iso === model || c.iso === end, 'is-range': inRange(c.iso),
          }"
          :disabled="past(c.iso) || busy(c.iso)"
          :aria-pressed="c.iso === model || c.iso === end || inRange(c.iso)"
          :aria-label="`${longDate.format(at(c.iso))}${busy(c.iso) ? ', belegt' : ''}`"
          @click="pick(c.iso)"
        >{{ c.day }}</button>
      </template>
    </div>

    <p v-if="model && !ok" class="cal__warn" role="alert">
      {{ range ? 'In diesem Zeitraum' : 'An diesem Tag' }} ist nicht alles frei. Bitte einen anderen Tag wählen.
    </p>
    <ul class="cal__legend" aria-hidden="true">
      <li><span class="cal__sw" /> Mo–Do</li>
      <li><span class="cal__sw cal__sw--we" /> Fr–So</li>
      <li><span class="cal__sw cal__sw--busy">12</span> belegt</li>
    </ul>
  </div>
</template>

<style scoped>
.cal { display: grid; gap: var(--s-3); }
.cal__nav { display: flex; align-items: center; justify-content: space-between; }
.cal__month { font-weight: 600; font-size: 0.9375rem; text-transform: capitalize; }
.cal__arrow {
  display: grid; place-items: center; width: 2.25rem; height: 2.25rem;
  border-radius: 50%; color: var(--c-text);
  transition: background var(--d-fast) var(--e-out);
}
.cal__arrow:hover:not(:disabled) { background: rgb(195 139 55 / 0.12); }
.cal__arrow:disabled { opacity: 0.25; cursor: default; }
.cal__back { transform: scaleX(-1); }

.cal__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
.cal__dow {
  padding-bottom: var(--s-1); text-align: center;
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em; color: var(--c-text-muted);
}
.cal__dow.is-we { color: var(--c-gold); }

.cal__day {
  aspect-ratio: 1; max-height: 2.75rem;
  display: grid; place-items: center;
  font-size: 0.875rem; font-variant-numeric: tabular-nums;
  color: var(--c-text); border-radius: var(--r-sm);
  transition: background var(--d-fast) var(--e-out), color var(--d-fast) var(--e-out);
}
.cal__day.is-we { background: rgb(195 139 55 / 0.12); }
.cal__day:hover:not(:disabled) { background: rgb(195 139 55 / 0.28); }
.cal__day.is-today { box-shadow: inset 0 0 0 1px var(--c-gold-hair); }
.cal__day.is-range { background: rgb(195 139 55 / 0.35); }
.cal__day.is-sel, .cal__day.is-sel:hover { background: var(--c-gold); color: #FFFFFF; font-weight: 600; }
.cal__day:disabled { color: var(--c-text-muted); opacity: 0.4; cursor: default; }
.cal__day.is-busy { text-decoration: line-through; background: transparent; }
.cal__day:focus-visible { outline: 2px solid var(--c-gold); outline-offset: 1px; }

.cal__warn { font-size: 0.8125rem; color: var(--c-danger); }

.cal__legend {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-wrap: wrap; gap: var(--s-1) var(--s-4);
  font-size: 0.75rem; color: var(--c-text-muted);
}
.cal__legend li { display: flex; align-items: center; gap: 0.4rem; }
.cal__sw {
  display: inline-grid; place-items: center; width: 1rem; height: 1rem;
  border-radius: 3px; border: 1px solid var(--c-gold-hair);
}
.cal__sw--we { background: rgb(195 139 55 / 0.2); border-color: transparent; }
.cal__sw--busy { border: 0; font-size: 0.625rem; text-decoration: line-through; opacity: 0.6; }
</style>
