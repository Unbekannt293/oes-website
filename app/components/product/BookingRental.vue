<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { soundboxRates } from '~~/shared/catalog'
import { depositCents, formatPrice, rentalDays, soundboxRentalCents } from '~~/shared/pricing'

// Buchung nach Zeitraum (Soundbox) in drei Schritten wie bei der Fotobox:
// Zeitraum im Kalender, Anzahl, Zusatzakku. Der Zeitraum kommt zuerst, damit
// die Anzahl gleich mit dem Preis fuer genau diese Tage dasteht.
const { product } = defineProps<{ product: Product }>()

const count = ref<1 | 2>(1)

// Bei zwei Soundboxen zeigt die Galerie das Doppel-Foto.
const emit = defineEmits<{ focus: [key: string] }>()
const from = ref('')
const to = ref('')
const rangeOk = ref(true)
const battery = ref(false)
const added = ref(false)

const minDate = ref<string>()
onMounted(() => { minDate.value = todayIso() })

const days = computed(() => (from.value && to.value ? rentalDays(from.value, to.value) : 0))
const perBox = computed(() => (days.value ? soundboxRentalCents(from.value, to.value) : 0))
const batteryCents = computed(() => (battery.value ? days.value * soundboxRates.extraBatteryPerDayCents : 0))
const total = computed(() => perBox.value * count.value + batteryCents.value)
const deposit = computed(() => depositCents(false, count.value))
const counts = computed(() => Array.from({ length: product.stock }, (_, i) => (i + 1) as 1 | 2))

const kurz = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
const knapp = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })
const rangeLabel = computed(() => {
  if (!days.value) return ''
  if (days.value === 1) return formatEventDate(from.value)
  const f = (s: string) => kurz.format(new Date(`${s}T12:00:00`))
  return `${f(from.value)} – ${f(to.value)} · ${days.value} Tage`
})
/** Fuer den zugeklappten Kopf: "23.10.–25.10. · 3 Tage". */
const rangeShort = computed(() => {
  if (!days.value) return ''
  if (days.value === 1) return kurz.format(new Date(`${from.value}T12:00:00`))
  const f = (s: string) => knapp.format(new Date(`${s}T12:00:00`))
  return `${f(from.value)}–${f(to.value)} · ${days.value} Tage`
})
const boxes = (n: number) => `${n} Soundbox${n > 1 ? 'en' : ''}`

// ---- Schritte ----
const steps = useSteps(3)
// Zeitraum nicht mehr frei (z. B. nach Wahl von 2 Soundboxen): zurueck zu 1.
watch(rangeOk, (v) => { if (!v) steps.reopen(1) })
watch(count, (n) => {
  emit('focus', `anzahl${n}`)
  steps.complete(2)
})

const summaries = computed(() => ({
  1: rangeShort.value,
  2: boxes(count.value),
  3: battery.value ? 'Zusatzakku' : 'Keiner',
}))

const ready = computed(() => steps.allDone.value && days.value > 0 && rangeOk.value)

watch([count, from, to, battery], () => { added.value = false })

const { add } = useCart()

function addToCart() {
  if (!ready.value) return
  add([
    {
      kind: 'product', slug: product.slug, name: product.name,
      detail: `${days.value} ${days.value === 1 ? 'Tag' : 'Tage'}`,
      unitPriceCents: perBox.value, quantity: count.value, from: from.value, to: to.value,
      freeDeliveryKm: 0, deposit: { fotobox: false, soundboxes: count.value },
    },
    ...(battery.value
      ? [{
          kind: 'addon' as const, slug: 'zusatzakku', name: 'Zusatzakku',
          detail: `${days.value} ${days.value === 1 ? 'Tag' : 'Tage'}`,
          unitPriceCents: batteryCents.value, quantity: 1, from: from.value, to: to.value, freeDeliveryKm: 0,
        }]
      : []),
  ])
  added.value = true
}
</script>

<template>
  <div class="bk">
    <h2 class="label bk__h">Soundbox mieten</h2>

    <div class="bk__steps">
      <BookingStep :n="1" title="Wann ist Ihre Feier?" :state="steps.state(1)" :summary="summaries[1]" @open="steps.open(1)">
        <ClientOnly>
          <DateCalendar
            v-model="from" v-model:to="to" v-model:ok="rangeOk" range
            :min="minDate" :fotobox="false" :soundboxes="count"
          />
          <template #fallback><div class="bk__cal-ph" /></template>
        </ClientOnly>
        <!-- Ein Klick waehlt einen Tag. Dass ein zweiter Klick den Zeitraum
             verlaengert, sieht man sonst nicht. -->
        <p v-if="days === 1" class="bk__small muted bk__tip">Mehrere Tage? Letzten Tag anklicken.</p>
        <div class="bk__row">
          <span v-if="days" class="bk__small">{{ rangeLabel }}</span>
          <UiButton
            variant="solid" size="sm" class="bk__next"
            :disabled="!days || !rangeOk" @click="steps.complete(1)"
          >
            Weiter <UiIcon name="arrow" :size="14" />
          </UiButton>
        </div>
      </BookingStep>

      <BookingStep :n="2" title="Anzahl" :state="steps.state(2)" :summary="summaries[2]" @open="steps.open(2)">
        <div class="opts" role="radiogroup" aria-label="Anzahl">
          <label v-for="n in counts" :key="n" class="opt" :class="{ 'is-sel': count === n }">
            <input v-model="count" type="radio" name="bk-anzahl" :value="n">
            <span class="opt__name">{{ boxes(n) }}</span>
            <span class="opt__price">{{ formatPrice(perBox * n) }}</span>
          </label>
        </div>
        <UiButton variant="solid" size="sm" class="bk__next" @click="steps.complete(2)">
          Weiter <UiIcon name="arrow" :size="14" />
        </UiButton>
      </BookingStep>

      <BookingStep :n="3" title="Zusatzakku" :state="steps.state(3)" :summary="summaries[3]" @open="steps.open(3)">
        <label class="check">
          <input v-model="battery" type="checkbox">
          <span class="bk__addon">
            <span>Zusatzakku</span>
            <span class="bk__addon-price">+ {{ formatPrice(days * soundboxRates.extraBatteryPerDayCents) }}</span>
          </span>
        </label>
        <UiButton variant="solid" size="sm" class="bk__next" @click="steps.complete(3)">
          Weiter <UiIcon name="arrow" :size="14" />
        </UiButton>
      </BookingStep>
    </div>

    <dl v-if="days" class="bk__sum">
      <div><dt>{{ count }} × Soundbox, {{ days }} {{ days === 1 ? 'Tag' : 'Tage' }}</dt><dd>{{ formatPrice(perBox * count) }}</dd></div>
      <div v-if="battery"><dt>Zusatzakku</dt><dd>+ {{ formatPrice(batteryCents) }}</dd></div>
      <div class="bk__total"><dt>Gesamt</dt><dd>{{ formatPrice(total) }}</dd></div>
      <div class="bk__note"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
    </dl>

    <UiButton variant="solid" size="lg" class="bk__btn" :disabled="!ready" @click="addToCart">
      <UiIcon name="cart" :size="18" /> In den Warenkorb
    </UiButton>

    <p v-if="added" class="bk__ok" role="status">
      <UiIcon name="check" :size="16" />
      Im Warenkorb. <NuxtLink to="/warenkorb">Zum Warenkorb</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
@import './booking.css';
</style>
