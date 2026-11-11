<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { anfrageSchema } from '~~/shared/schemas'

type Field = 'vorname' | 'nachname' | 'telefon' | 'email' | 'eventDatum' | 'nachricht' | 'datenschutz'

const contact = useContact()

const form = reactive({
  vorname: '',
  nachname: '',
  telefon: '',
  email: '',
  eventDatum: '',
  nachricht: '',
  datenschutz: false,
  website: '', // Honeypot
})
const errors = reactive<Partial<Record<Field, string>>>({})
const status = ref<'idle' | 'sending' | 'sent' | 'failed'>('idle')
const sentName = ref('')
const tried = ref(false)
const thanks = ref<HTMLElement | null>(null)

// Erst im Browser setzen: der Server rendert evtl. in einer anderen
// Zeitzone, das gaebe beim Hydrieren einen Unterschied.
const minDate = ref<string>()
// Zeitfalle gegen Bots (useZeitfalle, server/utils/bremse.ts).
const { ausfuellzeit } = useZeitfalle()
onMounted(() => {
  minDate.value = new Date().toLocaleDateString('sv-SE')
})

function clearErrors() {
  for (const k of Object.keys(errors) as Field[]) delete errors[k]
}

/** Ganzes Formular pruefen, Fehler je Feld eintragen (erster gewinnt). */
function validate() {
  const r = anfrageSchema.safeParse(form)
  clearErrors()
  if (r.success) return r.data
  for (const issue of r.error.issues) {
    const key = issue.path[0] as Field
    errors[key] ??= issue.message
  }
  return null
}

/** Beim Verlassen nur dieses Feld pruefen, und nur wenn schon etwas drinsteht. */
function touch(field: Field) {
  if (tried.value || !form[field]) return
  const r = anfrageSchema.shape[field].safeParse(form[field])
  if (r.success) delete errors[field]
  else errors[field] = r.error.issues[0]?.message
}

// Nach dem ersten Absendeversuch live nachpruefen, damit Fehler
// verschwinden, sobald sie behoben sind.
watch(form, () => { if (tried.value) validate() })

async function submit() {
  tried.value = true
  const data = validate()
  if (!data) {
    await nextTick()
    document.querySelector<HTMLElement>('.cf [aria-invalid="true"]')?.focus()
    return
  }

  status.value = 'sending'
  try {
    await $fetch('/api/anfrage', { method: 'POST', body: { ...data, ausfuellzeit: ausfuellzeit() } })
    sentName.value = data.vorname
    status.value = 'sent'
    await nextTick()
    thanks.value?.focus()
  }
  catch (err) {
    const e = err as FetchError<{ data?: { fields?: Record<string, string[]> } }>
    const fields = e.data?.data?.fields
    if (e.statusCode === 422 && fields) {
      for (const [k, msgs] of Object.entries(fields)) errors[k as Field] = msgs[0]
      status.value = 'idle'
    }
    else {
      status.value = 'failed'
    }
  }
}

/** Attribute, die jedes Feld fuer Screenreader und Fehlerdarstellung braucht. */
function a11y(field: Field) {
  return {
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `${field}-fehler` : undefined,
  }
}
</script>

<template>
  <div class="cf">
    <!-- Erfolg ersetzt das Formular. Fokus springt hierher, damit
         Screenreader die Bestaetigung vorlesen. -->
    <div v-if="status === 'sent'" ref="thanks" class="cf__done" tabindex="-1">
      <UiErfolg :titel="`Vielen Dank, ${sentName}!`">
        <p>Ihre Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich bei Ihnen.</p>
      </UiErfolg>
    </div>

    <form v-else novalidate class="cf__form" @submit.prevent="submit">
      <div class="cf__row">
        <UiField id="vorname" label="Vorname" :error="errors.vorname">
          <input
            id="vorname" v-model="form.vorname" class="control" type="text"
            autocomplete="given-name" v-bind="a11y('vorname')" @blur="touch('vorname')"
          >
        </UiField>
        <UiField id="nachname" label="Nachname" :error="errors.nachname">
          <input
            id="nachname" v-model="form.nachname" class="control" type="text"
            autocomplete="family-name" v-bind="a11y('nachname')" @blur="touch('nachname')"
          >
        </UiField>
      </div>

      <div class="cf__row">
        <UiField id="telefon" label="Telefonnummer" :error="errors.telefon">
          <input
            id="telefon" v-model="form.telefon" class="control" type="tel"
            autocomplete="tel" inputmode="tel" v-bind="a11y('telefon')" @blur="touch('telefon')"
          >
        </UiField>
        <UiField id="email" label="E-Mail" :error="errors.email">
          <input
            id="email" v-model="form.email" class="control" type="email"
            autocomplete="email" inputmode="email" v-bind="a11y('email')" @blur="touch('email')"
          >
        </UiField>
      </div>

      <UiField id="eventDatum" label="Veranstaltungsdatum" :error="errors.eventDatum" class="cf__date">
        <input
          id="eventDatum" v-model="form.eventDatum" class="control" type="date"
          :min="minDate" required v-bind="a11y('eventDatum')" @blur="touch('eventDatum')"
        >
      </UiField>

      <UiField id="nachricht" label="Nachricht" :error="errors.nachricht">
        <textarea
          id="nachricht" v-model="form.nachricht" class="control" rows="6" maxlength="4000"
          placeholder="Was planen Sie? Zum Beispiel Anlass, Gästezahl und was Sie sich wünschen."
          v-bind="a11y('nachricht')" @blur="touch('nachricht')"
        />
      </UiField>

      <UiFalle v-model="form.website" />

      <div class="cf__consent">
        <label class="check">
          <input
            id="datenschutz" v-model="form.datenschutz" type="checkbox"
            v-bind="a11y('datenschutz')"
          >
          <span>
            Ich bin einverstanden, dass meine Angaben zur Bearbeitung der
            Anfrage gespeichert werden. Mehr dazu in der
            <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink>.
          </span>
        </label>
        <UiFehler v-if="errors.datenschutz" id="datenschutz-fehler">{{ errors.datenschutz }}</UiFehler>
      </div>

      <UiHinweis v-if="status === 'failed'" ton="fehler">
        Die Nachricht konnte gerade nicht gesendet werden. Rufen Sie uns gern an unter
        <a :href="`tel:${contact.phoneRaw}`">{{ contact.phone }}</a> oder schreiben Sie an
        <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>.
      </UiHinweis>

      <UiButton
        variant="solid" size="lg" class="cf__submit"
        :disabled="status === 'sending'" :aria-busy="status === 'sending'"
      >
        <template v-if="status === 'sending'">Wird gesendet …</template>
        <template v-else>Anfrage senden <UiIcon name="arrow" :size="16" /></template>
      </UiButton>
    </form>
  </div>
</template>

<style scoped>
.cf__form { display: grid; gap: var(--s-5); }
.cf__row { display: grid; gap: var(--s-5); }
@media (min-width: 560px) {
  .cf__row { grid-template-columns: 1fr 1fr; }
  .cf__date { max-width: calc(50% - var(--s-5) / 2); }
}


.cf__consent { display: grid; gap: var(--s-2); }
.cf__submit { width: 100%; margin-top: var(--s-2); }

.cf__done { background: var(--c-paper-pure); border: var(--border-hair); padding: var(--s-6) var(--s-5); outline: none; }
</style>
