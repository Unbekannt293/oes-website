<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { BEZUEGE, type Bezug } from '~~/shared/bewertungen'
import { bewertungSchema } from '~~/shared/schemas'

// Bewertung schreiben. Aufbau wie das Kontaktformular: gleiches Schema im
// Browser und auf dem Server, Fehler je Feld, Honeypot gegen Bots.
const { bezug = null } = defineProps<{ bezug?: Bezug | null }>()
const emit = defineEmits<{ fertig: [] }>()
const MAX_TEXT = 1000

type Field = 'name' | 'sterne' | 'text' | 'einwilligung'

const form = reactive({
  name: '', sterne: 0, text: '', bezug: bezug as Bezug | null,
  einwilligung: false, website: '',
})
watch(() => bezug, (b) => { form.bezug = b })
const hover = ref(0)
// Zeitfalle gegen Bots: wie lange das Formular offen war (server/utils/bremse.ts).
let geoeffnet = 0
onMounted(() => { geoeffnet = Date.now() })
const errors = reactive<Partial<Record<Field, string>>>({})
const status = ref<'idle' | 'sending' | 'sent' | 'failed'>('idle')
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
    await $fetch('/api/bewertungen', { method: 'POST', body: { ...data, ausfuellzeit: Date.now() - geoeffnet } })
    status.value = 'sent'
    Object.assign(form, { name: '', sterne: 0, text: '', einwilligung: false })
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
    <div v-if="status === 'sent'" class="bf__done" role="status">
      <span class="bf__badge"><UiIcon name="check" :size="24" /></span>
      <h3 class="display bf__done-h">Vielen Dank!</h3>
      <p class="muted">Ihre Bewertung erscheint, sobald wir sie freigeschaltet haben.</p>
      <UiButton variant="outline" size="sm" @click="status = 'idle'; emit('fertig')">Weitere Bewertung schreiben</UiButton>
    </div>

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
        <p v-if="errors.sterne" id="bw-sterne-fehler" class="bf__err"><UiIcon name="alert" :size="14" />{{ errors.sterne }}</p>
      </fieldset>

      <UiField id="bw-name" label="Name" :error="errors.name">
        <input id="bw-name" v-model="form.name" class="control" type="text" autocomplete="name" placeholder="Ihr Name, z. B. Anna M." v-bind="a11y('name')">
      </UiField>

      <UiField id="bw-bezug" label="Gemietetes Produkt">
        <select id="bw-bezug" v-model="form.bezug" class="control">
          <option :value="null">OES allgemein</option>
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

      <!-- Honeypot: fuer Menschen unsichtbar und nicht per Tab erreichbar. -->
      <div class="bf__trap" aria-hidden="true">
        <label for="bw-website">Website</label>
        <input id="bw-website" v-model="form.website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <div>
        <label class="check">
          <input id="bw-einwilligung" v-model="form.einwilligung" type="checkbox" v-bind="a11y('einwilligung')">
          <span>
            Ich bin einverstanden, dass meine Bewertung mit Namen auf dieser Seite
            veröffentlicht wird. Mehr dazu in der <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink>.
          </span>
        </label>
        <p v-if="errors.einwilligung" id="bw-einwilligung-fehler" class="bf__err"><UiIcon name="alert" :size="14" />{{ errors.einwilligung }}</p>
      </div>

      <p v-if="status === 'failed'" class="bf__fail" role="alert">
        <UiIcon name="alert" :size="16" />
        Das hat gerade nicht geklappt. Bitte versuchen Sie es später noch einmal.
      </p>

      <UiButton variant="solid" class="bf__submit" :disabled="status === 'sending'" :aria-busy="status === 'sending'">
        <template v-if="status === 'sending'">Wird gesendet …</template>
        <template v-else><UiIcon name="send" :size="16" /> Bewertung absenden</template>
      </UiButton>
      <p class="bf__hint muted"><UiIcon name="lock" :size="14" /> Ihre Bewertung wird nach Prüfung veröffentlicht.</p>
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
.bf__star :deep(svg) { fill: transparent; stroke-width: 1.2; transition: fill var(--d-fast) var(--e-out); }
.bf__star.is-on :deep(svg) { fill: currentColor; }
.bf__star:hover { transform: scale(1.08); }
.bf__radio { position: absolute; opacity: 0; width: 1px; height: 1px; }
.bf__star:has(.bf__radio:focus-visible) { outline: 2px solid var(--c-gold); outline-offset: 2px; border-radius: var(--r-sm); }
.bf__stars-txt { margin-left: var(--s-3); font-size: var(--t-small); }
.bf__trap { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.bf__err { display: flex; align-items: center; gap: 0.4rem; margin-top: var(--s-2); font-size: 0.8125rem; color: var(--c-danger); }
.bf__fail { display: flex; align-items: center; gap: var(--s-2); font-size: var(--t-small); color: var(--c-danger); }
.bf__area { position: relative; }
.bf__area textarea { padding-bottom: 1.75rem; resize: vertical; }
.bf__count { position: absolute; right: 0.75rem; bottom: 0.5rem; font-size: 0.75rem; pointer-events: none; }
.bf__submit { width: 100%; gap: var(--s-2); }
.bf__hint { display: flex; align-items: center; gap: var(--s-2); font-size: var(--t-small); margin-top: calc(-1 * var(--s-3)); }
.bf__done { display: grid; justify-items: center; gap: var(--s-3); padding: var(--s-6) 0; text-align: center; }
.bf__badge { display: grid; place-items: center; width: 3.25rem; height: 3.25rem; border-radius: 50%; color: var(--c-gold); border: 1px solid var(--c-gold); }
.bf__done-h { font-size: var(--t-h3); }
</style>
