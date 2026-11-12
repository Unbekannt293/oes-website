<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { BEZUEGE, BILDER_MAX, type Bezug } from '~~/shared/bewertungen'
import { bewertungSchema } from '~~/shared/schemas'
import { FIRMA } from '~~/shared/firma'

// Bewertung schreiben. Aufbau wie das Kontaktformular: gleiches Schema im
// Browser und auf dem Server, Fehler je Feld, Honeypot gegen Bots.
const { bezug = null } = defineProps<{ bezug?: Bezug | null }>()
const emit = defineEmits<{ fertig: [] }>()
const MAX_TEXT = 1000

type Field = 'name' | 'sterne' | 'text' | 'einwilligung' | 'bilder' | 'bezug'

const form = reactive({
  name: '', sterne: 0, text: '', bezug: bezug as Bezug | null,
  einwilligung: false, website: '', bilder: [] as string[],
})

// Fotos: im Browser verkleinert (app/utils/fotoVerkleinern.ts), der Upload
// ist derselbe Baustein wie beim Logo (UiUpload).
const fotos = computed({
  get: () => form.bilder.map(src => ({ src })),
  set: (v: { src: string }[]) => { form.bilder = v.map(x => x.src); delete errors.bilder },
})
watch(() => bezug, (b) => { form.bezug = b })
const hover = ref(0)
// Zeitfalle gegen Bots: wie lange das Formular offen war (server/utils/bremse.ts).
const { ausfuellzeit } = useZeitfalle()
const errors = reactive<Partial<Record<Field, string>>>({})
const status = ref<'idle' | 'sending' | 'sent' | 'failed'>('idle')
/** Fotos, die der Server nicht speichern konnte (z. B. kaputte Datei). */
const fotosFehlen = ref(0)
const tried = ref(false)

const sterneText = ['', 'Schlecht', 'Geht so', 'In Ordnung', 'Gut', 'Hervorragend']

function validate() {
  const r = bewertungSchema.safeParse(form)
  for (const k of Object.keys(errors) as Field[]) delete errors[k]
  if (r.success) return r.data
  for (const issue of r.error.issues) errors[issue.path[0] as Field] ??= issue.message
  return null
}
watch(form, () => { if (tried.value) validate() })

async function submit() {
  tried.value = true
  const data = validate()
  if (!data) return
  status.value = 'sending'
  try {
    const antwort = await $fetch<{ ok: boolean, fotosFehlen?: number }>('/api/bewertungen', { method: 'POST', body: { ...data, ausfuellzeit: ausfuellzeit() } })
    fotosFehlen.value = antwort.fotosFehlen ?? 0
    status.value = 'sent'
    Object.assign(form, { name: '', sterne: 0, text: '', einwilligung: false, bilder: [] })
    tried.value = false
  }
  catch (err) {
    const e = err as FetchError<{ data?: { fields?: Record<string, string[]> } }>
    const fields = e.data?.data?.fields
    if (e.statusCode === 422 && fields) {
      for (const [k, msgs] of Object.entries(fields)) errors[k as Field] = msgs[0]
      status.value = 'idle'
    }
    else status.value = 'failed'
  }
}

function a11y(field: Field) {
  return {
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `bw-${field}-fehler` : undefined,
  }
}
</script>

<template>
  <div class="bf">
    <UiErfolg v-if="status === 'sent'" titel="Vielen Dank!">
      <p>Ihre Bewertung erscheint, sobald wir sie freigeschaltet haben.</p>
      <UiHinweis v-if="fotosFehlen" ton="fehler">
        {{ fotosFehlen === 1 ? 'Ein Foto konnte' : `${fotosFehlen} Fotos konnten` }} leider nicht gespeichert werden.
        Schicken Sie es uns gern per E-Mail an {{ FIRMA.email }}.
      </UiHinweis>
      <template #aktion>
        <UiButton variant="outline" size="sm" @click="status = 'idle'; emit('fertig')">Weitere Bewertung schreiben</UiButton>
      </template>
    </UiErfolg>

    <form v-else novalidate class="bf__form" @submit.prevent="submit">
      <fieldset class="bf__stars-set">
        <legend class="label bf__legend">Ihre Bewertung</legend>
        <div class="bf__stars" @mouseleave="hover = 0">
          <label v-for="i in 5" :key="i" class="bf__star" :class="{ 'is-on': i <= (hover || form.sterne) }" @mouseenter="hover = i">
            <input v-model="form.sterne" type="radio" name="bw-sterne" :value="i" class="bf__radio" v-bind="a11y('sterne')">
            <UiIcon name="star" :size="30" />
            <span class="visually-hidden">{{ i }} von 5 Sternen</span>
          </label>
          <span class="bf__stars-txt muted">{{ sterneText[hover || form.sterne] }}</span>
        </div>
        <UiFehler v-if="errors.sterne" id="bw-sterne-fehler">{{ errors.sterne }}</UiFehler>
      </fieldset>

      <UiField id="bw-name" label="Name" :error="errors.name">
        <input id="bw-name" v-model="form.name" class="control" type="text" autocomplete="name" placeholder="Ihr Name, z. B. Anna M." v-bind="a11y('name')">
      </UiField>

      <UiField id="bw-bezug" label="Gemietetes Produkt" :error="errors.bezug">
        <select id="bw-bezug" v-model="form.bezug" class="control" v-bind="a11y('bezug')">
          <option :value="null" disabled>Bitte wählen</option>
          <option v-for="(label, key) in BEZUEGE" :key="key" :value="key">{{ label }}</option>
        </select>
      </UiField>

      <UiField id="bw-text" label="Ihre Erfahrung" :error="errors.text">
        <div class="bf__area">
          <textarea
            id="bw-text" v-model="form.text" class="control" rows="5" :maxlength="MAX_TEXT"
            placeholder="Wie war Ihre Erfahrung mit uns?" v-bind="a11y('text')"
          />
          <span class="bf__count muted" aria-hidden="true">{{ form.text.length }} / {{ MAX_TEXT }}</span>
        </div>
      </UiField>

      <div class="bf__fotos">
        <p class="label bf__legend">Fotos <span class="muted bf__opt">(optional, bis zu {{ BILDER_MAX }})</span></p>
        <UiUpload v-model="fotos" :lesen="fotoVerkleinern" :max="BILDER_MAX" label="Foto" accept="image/*" />
        <UiFehler v-if="errors.bilder">{{ errors.bilder }}</UiFehler>
      </div>

      <UiFalle v-model="form.website" />

      <div>
        <label class="check">
          <input id="bw-einwilligung" v-model="form.einwilligung" type="checkbox" v-bind="a11y('einwilligung')">
          <span>
            Ich bin einverstanden, dass meine Bewertung mit Namen{{ form.bilder.length ? ' und Fotos' : '' }} auf dieser Seite
            veröffentlicht wird<template v-if="form.bilder.length">, und habe die Rechte an den Fotos</template>. Mehr dazu in der <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink>.
          </span>
        </label>
        <UiFehler v-if="errors.einwilligung" id="bw-einwilligung-fehler">{{ errors.einwilligung }}</UiFehler>
      </div>

      <UiHinweis v-if="status === 'failed'" ton="fehler">
        Das hat gerade nicht geklappt. Bitte versuchen Sie es später noch einmal.
      </UiHinweis>

      <UiButton variant="solid" class="bf__submit" :disabled="status === 'sending'" :aria-busy="status === 'sending'">
        <template v-if="status === 'sending'">Wird gesendet …</template>
        <template v-else><UiIcon name="send" :size="16" /> Bewertung absenden</template>
      </UiButton>
      <p class="notiz bf__hint"><UiIcon name="lock" :size="14" /> Ihre Bewertung wird nach Prüfung veröffentlicht.</p>
    </form>
  </div>
</template>

<style scoped>
.bf__form { display: grid; gap: var(--s-5); }
.bf__stars-set { border: 0; padding: 0; margin: 0; min-width: 0; display: grid; gap: var(--s-2); }
.bf__legend { padding: 0; margin-bottom: var(--s-2); color: var(--c-text); }
.bf__stars { display: flex; align-items: center; gap: 0.15rem; }
.bf__star { position: relative; cursor: pointer; color: var(--c-gold); line-height: 0; padding: 0.15rem; transition: transform var(--d-fast) var(--e-out); }
/* Leer als Umriss, gewaehlt gefuellt, wie in Louis' Entwurf. */
/* Leer als Umriss, gewaehlt gefuellt. */
.bf__star :deep(svg) { fill: transparent; stroke-width: 1.2; transition: fill var(--d-fast) var(--e-out); }
.bf__star.is-on :deep(svg) { fill: currentColor; }
.bf__star:hover { transform: scale(1.08); }
.bf__radio { position: absolute; opacity: 0; width: 1px; height: 1px; }
.bf__star:has(.bf__radio:focus-visible) { outline: 2px solid var(--c-gold); outline-offset: 2px; border-radius: var(--r-sm); }
.bf__stars-txt { margin-left: var(--s-3); font-size: var(--t-small); }
.bf__area { position: relative; }
.bf__area textarea { padding-bottom: 1.75rem; resize: vertical; }
.bf__count { position: absolute; right: 0.75rem; bottom: 0.5rem; font-size: var(--t-2xs); pointer-events: none; }
.bf__submit { width: 100%; gap: var(--s-2); }
.bf__opt { text-transform: none; letter-spacing: 0; font-weight: 400; }
.bf__hint { margin-top: calc(-1 * var(--s-3)); }
</style>
