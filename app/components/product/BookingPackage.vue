<script setup lang="ts">
import { addons, fotoboxPackages, SOUNDBOX_DISCOUNT_PCT } from '~~/shared/catalog'
import { depositCents, formatPrice, packagePriceCents, PRICE_PER_KM_CENTS } from '~~/shared/pricing'

// Buchung einer Fotobox: Paket, Soundboxen, Veranstaltungstag, Zubehoer.
// In den Warenkorb geht es erst, wenn Paket und Datum gewaehlt sind
// (Louis: "Geht nur zum Warenkorb hinzufügen wenn Paket+Veranstaltungsdatum
// ausgefüllt ist").
const paket = defineModel<string>('paket', { default: '' })

const soundboxes = ref<0 | 1 | 2>(0)

// Die Seite zeigt passend zur Soundbox-Wahl das richtige Foto in der Galerie.
const emit = defineEmits<{ focus: [key: string] }>()
watch(soundboxes, n => emit('focus', `sb${n}`))
const date = ref('')
const chosen = ref<string[]>([])
const added = ref(false)

// Erst im Browser setzen, damit Server und Browser dasselbe HTML rendern.
const minDate = ref<string>()
onMounted(() => { minDate.value = todayIso() })

const pkg = computed(() => fotoboxPackages.find(p => p.slug === paket.value && p.available))
const bookable = fotoboxPackages.filter(p => p.available)
const ready = computed(() => !!pkg.value && !!date.value)

/** Ohne Datum steht noch nicht fest, ob Mo-Do oder Fr-So gilt: dann "ab". */
const pkgPrice = computed(() => {
  if (!pkg.value) return null
  if (date.value) return packagePriceCents(pkg.value, soundboxes.value, date.value)
  return soundboxes.value ? pkg.value.withSoundbox![soundboxes.value].moDo : pkg.value.priceCents
})
const priceIsFrom = computed(() => !!pkg.value && soundboxes.value > 0 && !date.value)

const chosenAddons = computed(() => addons.filter(a => a.available && chosen.value.includes(a.slug)))
const addonsTotal = computed(() => chosenAddons.value.reduce((s, a) => s + a.priceCents, 0))
const total = computed(() => (pkgPrice.value ?? 0) + addonsTotal.value)
const deposit = computed(() => depositCents(true, soundboxes.value))

// Auswahl geaendert: Bestaetigung ausblenden, sonst wirkt sie wie ein Fehler.
watch([paket, soundboxes, date, chosen], () => { added.value = false }, { deep: true })

const { add } = useCart()

function addToCart() {
  if (!ready.value || !pkg.value || pkgPrice.value === null) return
  const p = pkg.value
  const sbText = soundboxes.value ? `mit ${soundboxes.value} Soundbox${soundboxes.value > 1 ? 'en' : ''}` : 'ohne Soundbox'
  add([
    {
      kind: 'package', slug: p.slug, name: p.name, detail: sbText,
      unitPriceCents: pkgPrice.value, quantity: 1, from: date.value, to: date.value,
      freeDeliveryKm: p.freeDeliveryKm, deposit: { fotobox: true, soundboxes: soundboxes.value },
    },
    ...chosenAddons.value.map(a => ({
      kind: 'addon' as const, slug: a.slug, name: a.name,
      unitPriceCents: a.priceCents, quantity: 1, from: date.value, to: date.value, freeDeliveryKm: 0,
    })),
  ])
  added.value = true
}
</script>

<template>
  <div class="bk">
    <h2 class="label bk__h">Zum Warenkorb hinzufügen</h2>
    <p class="bk__intro muted">Wählen Sie ein Paket und den Tag Ihrer Veranstaltung.</p>

    <UiField id="bk-paket" label="Paket auswählen">
      <select id="bk-paket" v-model="paket" class="control" :class="{ 'is-empty': !paket }">
        <option value="" disabled>Bitte auswählen</option>
        <option v-for="p in bookable" :key="p.slug" :value="p.slug">
          {{ p.name }} · {{ formatPrice(p.priceCents) }}
        </option>
      </select>
    </UiField>

    <fieldset class="bk__set">
      <legend class="label bk__legend">Soundbox dazu</legend>
      <div class="segments">
        <label>
          <input v-model="soundboxes" type="radio" name="bk-sb" :value="0">
          <span>Ohne</span>
        </label>
        <label>
          <input v-model="soundboxes" type="radio" name="bk-sb" :value="1">
          <span>+1 Soundbox <small>−{{ SOUNDBOX_DISCOUNT_PCT[1] }} %</small></span>
        </label>
        <label>
          <input v-model="soundboxes" type="radio" name="bk-sb" :value="2">
          <span>+2 Soundboxen <small>−{{ SOUNDBOX_DISCOUNT_PCT[2] }} %</small></span>
        </label>
      </div>
    </fieldset>

    <UiField id="bk-datum" label="Veranstaltungsdatum">
      <input id="bk-datum" v-model="date" type="date" class="control" :min="minDate" required>
    </UiField>

    <fieldset class="bk__set">
      <legend class="label bk__legend">Zubehör <span class="bk__opt">(optional)</span></legend>
      <ul class="bk__addons">
        <li v-for="a in addons" :key="a.slug">
          <label class="check" :class="{ 'is-off': !a.available }">
            <input v-model="chosen" type="checkbox" :value="a.slug" :disabled="!a.available">
            <span class="bk__addon">
              <span>{{ a.name }}</span>
              <span v-if="a.available" class="bk__addon-price">+ {{ formatPrice(a.priceCents) }}</span>
              <span v-else class="bk__addon-soon">bald</span>
            </span>
          </label>
        </li>
      </ul>
    </fieldset>

    <dl v-if="pkg" class="bk__sum">
      <div><dt>{{ pkg.name }}{{ soundboxes ? ` + ${soundboxes} Soundbox${soundboxes > 1 ? 'en' : ''}` : '' }}</dt>
        <dd>{{ priceIsFrom ? 'ab ' : '' }}{{ formatPrice(pkgPrice ?? 0) }}</dd></div>
      <div v-for="a in chosenAddons" :key="a.slug"><dt>{{ a.name }}</dt><dd>{{ formatPrice(a.priceCents) }}</dd></div>
      <div class="bk__total"><dt>Gesamt</dt><dd>{{ priceIsFrom ? 'ab ' : '' }}{{ formatPrice(total) }}</dd></div>
      <div class="bk__note"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
      <p class="bk__small muted">
        Kostenlose Lieferung bis {{ pkg.freeDeliveryKm }} km, danach {{ formatPrice(PRICE_PER_KM_CENTS) }} pro km.
        <template v-if="priceIsFrom">Freitag bis Sonntag etwas teurer.</template>
      </p>
    </dl>

    <UiButton variant="solid" size="lg" class="bk__btn" :disabled="!ready" @click="addToCart">
      <UiIcon name="cart" :size="18" /> Zum Warenkorb hinzufügen
    </UiButton>
    <p v-if="!ready" class="bk__small muted bk__hint">
      <UiIcon name="info" :size="14" /> Bitte Paket und Veranstaltungsdatum wählen.
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
