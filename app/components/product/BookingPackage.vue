<script setup lang="ts">
import type { Weekpart } from '~~/shared/types'
import { addons, fotoboxPackages, LAYOUT_ADDON } from '~~/shared/catalog'
import {
  depositCents, formatPrice, kombiAddCents, packagePriceCents, PRICE_PER_KM_CENTS,
  soundboxDayCents, weekpartOf,
} from '~~/shared/pricing'

// Buchung einer Fotobox in vier Schritten: Tag, Ausdrucke, Soundbox, Zubehoer.
// Der Tag kommt zuerst, weil der Soundbox-Aufpreis davon abhaengt (Mo-Do
// oder Fr-So). Danach zeigt jede Option ihren Aufpreis fuer genau diesen
// Tag, Kombi-Rabatt als durchgestrichener Einzelpreis statt als Text.
// In den Warenkorb erst mit Stufe und Datum (Louis: "Geht nur zum Warenkorb
// hinzufügen wenn Paket+Veranstaltungsdatum ausgefüllt ist").
const paket = defineModel<string>('paket', { default: '' })
const soundboxes = defineModel<0 | 1 | 2>('soundboxes', { default: 0 })

// Die Seite zeigt passend zur Soundbox-Wahl das richtige Foto in der Galerie.
const emit = defineEmits<{ focus: [key: string] }>()
watch(soundboxes, n => emit('focus', `sb${n}`))

const date = ref('')
const dateOk = ref(true)
const chosen = ref<string[]>([])
const added = ref(false)

// Erst im Browser setzen, damit Server und Browser dasselbe HTML rendern.
const minDate = ref<string>()
onMounted(() => { minDate.value = todayIso() })

const bookable = fotoboxPackages.filter(p => p.available)
const pkg = computed(() => bookable.find(p => p.slug === paket.value))
const ready = computed(() => !!pkg.value && !!date.value && dateOk.value)

/** Ohne Datum steht der Wochenteil noch nicht fest: dann gilt "ab" (Mo-Do). */
const part = computed<Weekpart>(() => date.value ? weekpartOf(date.value) : 'moDo')
const isFrom = computed(() => !date.value)

/** Aufpreis fuer n Soundboxen. Ohne gewaehlte Stufe: der kleinste moegliche. */
function addFor(n: 0 | 1 | 2) {
  if (pkg.value) return kombiAddCents(pkg.value, n, part.value)
  return Math.min(...bookable.map(p => kombiAddCents(p, n, part.value)))
}
const sbOptions = [
  { n: 0 as const, label: 'Keine' },
  { n: 1 as const, label: '1 Soundbox' },
  { n: 2 as const, label: '2 Soundboxen' },
]

// Ab Premium ist das eigene Foto-Layout inklusive: dann nicht berechnen.
// Zubehoer, das es noch nicht gibt, steht hier gar nicht erst.
const layoutIncluded = computed(() => !!pkg.value?.designIncluded)
const shopAddons = addons.filter(a => a.available)
const chosenAddons = computed(() => shopAddons.filter(a =>
  chosen.value.includes(a.slug) && !(a.slug === LAYOUT_ADDON && layoutIncluded.value)))
const addonsTotal = computed(() => chosenAddons.value.reduce((s, a) => s + a.priceCents, 0))

const pkgPrice = computed(() => pkg.value
  ? (date.value ? packagePriceCents(pkg.value, soundboxes.value, date.value) : pkg.value.priceCents + addFor(soundboxes.value))
  : 0)
const total = computed(() => pkgPrice.value + addonsTotal.value)
const deposit = computed(() => depositCents(true, soundboxes.value))
const dayLabel = computed(() => date.value ? formatEventDate(date.value) : '')

// Auswahl geaendert: Bestaetigung ausblenden, sonst wirkt sie wie ein Fehler.
watch([paket, soundboxes, date, chosen], () => { added.value = false }, { deep: true })

const { add } = useCart()

function addToCart() {
  if (!ready.value || !pkg.value) return
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
    <h2 class="label bk__h">Fotobox buchen</h2>

    <section class="bk__step" aria-labelledby="bk-s1">
      <h3 id="bk-s1" class="bk__step-h"><span class="bk__no">1</span> Wann ist Ihre Feier?</h3>
      <ClientOnly>
        <DateCalendar v-model="date" v-model:ok="dateOk" :min="minDate" :soundboxes="soundboxes" />
        <template #fallback><div class="bk__cal-ph" /></template>
      </ClientOnly>
    </section>

    <section class="bk__step" aria-labelledby="bk-s2">
      <h3 id="bk-s2" class="bk__step-h"><span class="bk__no">2</span> Ausdrucke</h3>
      <div class="opts" role="radiogroup" aria-labelledby="bk-s2">
        <label v-for="p in bookable" :key="p.slug" class="opt" :class="{ 'is-sel': paket === p.slug }">
          <input v-model="paket" type="radio" name="bk-paket" :value="p.slug">
          <span class="opt__main">
            <span class="opt__name">{{ p.prints ? `${p.prints} Ausdrucke` : 'Nur digital' }}</span>
            <span class="opt__sub">{{ p.short }}</span>
          </span>
          <span class="opt__price">{{ formatPrice(p.priceCents) }}</span>
        </label>
      </div>
    </section>

    <section class="bk__step" aria-labelledby="bk-s3">
      <h3 id="bk-s3" class="bk__step-h"><span class="bk__no">3</span> Soundbox dazu</h3>
      <div class="opts" role="radiogroup" aria-labelledby="bk-s3">
        <label v-for="o in sbOptions" :key="o.n" class="opt" :class="{ 'is-sel': soundboxes === o.n }">
          <input v-model="soundboxes" type="radio" name="bk-sb" :value="o.n">
          <span class="opt__name">{{ o.label }}</span>
          <span v-if="o.n" class="opt__price">
            <span>+ {{ isFrom ? 'ab ' : '' }}{{ formatPrice(addFor(o.n)) }}</span>
            <s class="opt__was" :aria-label="`einzeln ${formatPrice(soundboxDayCents(o.n, part))}`">{{ formatPrice(soundboxDayCents(o.n, part)) }}</s>
          </span>
        </label>
      </div>
    </section>

    <section v-if="shopAddons.length" class="bk__step" aria-labelledby="bk-s4">
      <h3 id="bk-s4" class="bk__step-h"><span class="bk__no">4</span> Zubehör</h3>
      <ul class="bk__addons">
        <li v-for="a in shopAddons" :key="a.slug">
          <!-- Inklusives Layout: angehakt und gesperrt, ohne Aufpreis. -->
          <label v-if="a.slug === LAYOUT_ADDON && layoutIncluded" class="check is-off">
            <input type="checkbox" checked disabled>
            <span class="bk__addon">
              <span>{{ a.name }}</span>
              <span class="bk__addon-incl">inklusive</span>
            </span>
          </label>
          <label v-else class="check">
            <input v-model="chosen" type="checkbox" :value="a.slug">
            <span class="bk__addon">
              <span>{{ a.name }}</span>
              <span class="bk__addon-price">+ {{ formatPrice(a.priceCents) }}</span>
            </span>
          </label>
        </li>
      </ul>
    </section>

    <dl v-if="pkg" class="bk__sum">
      <div><dt>Fotobox {{ pkg.short }}</dt><dd>{{ formatPrice(pkg.priceCents) }}</dd></div>
      <div v-if="soundboxes">
        <dt>{{ soundboxes }} Soundbox{{ soundboxes > 1 ? 'en' : '' }}</dt>
        <dd>+ {{ formatPrice(pkgPrice - pkg.priceCents) }}</dd>
      </div>
      <div v-for="a in chosenAddons" :key="a.slug"><dt>{{ a.name }}</dt><dd>+ {{ formatPrice(a.priceCents) }}</dd></div>
      <div class="bk__total">
        <dt>{{ dayLabel || 'Gesamt' }}</dt>
        <dd>{{ isFrom && soundboxes ? 'ab ' : '' }}{{ formatPrice(total) }}</dd>
      </div>
      <div class="bk__note"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
      <p class="bk__small muted">
        Lieferung bis {{ pkg.freeDeliveryKm }} km inklusive, danach {{ formatPrice(PRICE_PER_KM_CENTS) }} pro km.
      </p>
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
