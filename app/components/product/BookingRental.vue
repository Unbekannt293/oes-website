<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { soundboxRates } from '~~/shared/catalog'
import { depositCents, formatPrice, rentalDays, soundboxRentalCents } from '~~/shared/pricing'

// Buchung nach Zeitraum (Soundbox): Anzahl, von, bis, Zusatzakku.
const { product } = defineProps<{ product: Product }>()

const count = ref(1)
const from = ref('')
const to = ref('')
const battery = ref(false)
const added = ref(false)

const minDate = ref<string>()
onMounted(() => { minDate.value = todayIso() })

// "Bis" darf nicht vor "von" liegen. Wird "von" spaeter gesetzt, mitziehen.
watch(from, (v) => { if (v && (!to.value || to.value < v)) to.value = v })

const days = computed(() => (from.value && to.value ? rentalDays(from.value, to.value) : 0))
const ready = computed(() => days.value > 0)
const perBox = computed(() => (ready.value ? soundboxRentalCents(from.value, to.value) : 0))
const batteryCents = computed(() => (battery.value ? days.value * soundboxRates.extraBatteryPerDayCents : 0))
const total = computed(() => perBox.value * count.value + batteryCents.value)
const deposit = computed(() => depositCents(false, count.value))

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
    <h2 class="label bk__h">Zum Warenkorb hinzufügen</h2>
    <p class="bk__intro muted">
      {{ formatPrice(soundboxRates.perDayCents.moDo) }} pro Tag (Mo–Do),
      {{ formatPrice(soundboxRates.perDayCents.frSo) }} (Fr–So).
      Wochenende Fr–So {{ formatPrice(soundboxRates.weekendCents) }},
      ganze Woche {{ formatPrice(soundboxRates.weekCents) }}.
    </p>

    <fieldset class="bk__set">
      <legend class="label bk__legend">Anzahl</legend>
      <div class="segments">
        <label v-for="n in product.stock" :key="n">
          <input v-model="count" type="radio" name="bk-anzahl" :value="n">
          <span>{{ n }} Soundbox{{ n > 1 ? 'en' : '' }}</span>
        </label>
      </div>
    </fieldset>

    <div class="bk__dates">
      <UiField id="bk-von" label="Von">
        <input id="bk-von" v-model="from" type="date" class="control" :min="minDate" required>
      </UiField>
      <UiField id="bk-bis" label="Bis">
        <input id="bk-bis" v-model="to" type="date" class="control" :min="from || minDate" required>
      </UiField>
    </div>

    <label class="check">
      <input v-model="battery" type="checkbox">
      <span class="bk__addon">
        <span>Zusatzakku</span>
        <span class="bk__addon-price">+ {{ formatPrice(soundboxRates.extraBatteryPerDayCents) }} pro Tag</span>
      </span>
    </label>

    <dl v-if="ready" class="bk__sum">
      <div><dt>{{ count }} × Soundbox, {{ days }} {{ days === 1 ? 'Tag' : 'Tage' }}</dt><dd>{{ formatPrice(perBox * count) }}</dd></div>
      <div v-if="battery"><dt>Zusatzakku</dt><dd>{{ formatPrice(batteryCents) }}</dd></div>
      <div class="bk__total"><dt>Gesamt</dt><dd>{{ formatPrice(total) }}</dd></div>
      <div class="bk__note"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
    </dl>

    <UiButton variant="solid" size="lg" class="bk__btn" :disabled="!ready" @click="addToCart">
      <UiIcon name="cart" :size="18" /> Zum Warenkorb hinzufügen
    </UiButton>
    <p v-if="!ready" class="bk__small muted bk__hint">
      <UiIcon name="info" :size="14" /> Bitte den Mietzeitraum wählen.
    </p>

    <p v-if="added" class="bk__ok" role="status">
      <UiIcon name="check" :size="16" />
      Im Warenkorb. <NuxtLink to="/warenkorb">Zum Warenkorb</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
@import './booking.css';
</style>
