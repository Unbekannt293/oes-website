<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { addons, fotoboxPackages, LAYOUT_ADDON, soundboxRates } from '~~/shared/catalog'
import {
  depositCents, eachDay, formatPrice, kombiAddCents, packageRangeCents, PRICE_PER_KM_CENTS,
  rentalDays, soundboxDayCents, soundboxRentalCents, weekpartOf,
} from '~~/shared/pricing'

// Buchung einer Fotobox in vier Schritten (Akkordeon, siehe useSteps):
// Tag(e), Ausdrucke, Soundbox, Zubehoer. Die Tage kommen zuerst, weil der
// Soundbox-Aufpreis davon abhaengt (Mo-Do oder Fr-So). Danach zeigt jede
// Option ihren Preis fuer genau diese Tage, Kombi-Rabatt als
// durchgestrichener Einzelpreis statt als Text.
// In den Warenkorb erst, wenn alle Schritte fertig sind (Louis: "Geht nur zum
// Warenkorb hinzufügen wenn Paket+Veranstaltungsdatum ausgefüllt ist").
const paket = defineModel<string>('paket', { default: '' })
const soundboxes = defineModel<0 | 1 | 2>('soundboxes', { default: 0 })

// Die Seite zeigt passend zur Soundbox-Wahl das richtige Foto in der Galerie.
const emit = defineEmits<{ focus: [key: string] }>()

const from = ref('')
const to = ref('')
const rangeOk = ref(true)
const chosen = ref<string[]>([])
const battery = ref(false)
const added = ref(false)

// Erst im Browser setzen, damit Server und Browser dasselbe HTML rendern.
const minDate = ref<string>()

const bookable = fotoboxPackages.filter(p => p.available)
const pkg = computed(() => bookable.find(p => p.slug === paket.value))
const days = computed(() => (from.value && to.value ? rentalDays(from.value, to.value) : 0))
/** Gewaehlte Tage, ohne Wahl ein Platzhalter-Montag fuer die "ab"-Preise. */
const dayList = computed(() => (days.value ? eachDay(from.value, to.value) : ['2026-01-05']))
const isFrom = computed(() => !days.value)
const n = computed(() => Math.max(days.value, 1))

/** Soundbox-Aufpreis ueber alle Tage. Ohne gewaehlte Stufe: der kleinste moegliche. */
function addFor(sb: 0 | 1 | 2, p: RentalPackage | undefined = pkg.value) {
  const sum = (q: RentalPackage) => dayList.value.reduce((s, d) => s + kombiAddCents(q, sb, weekpartOf(d)), 0)
  return p ? sum(p) : Math.min(...bookable.map(sum))
}
/** Was dieselben Soundboxen einzeln kosten wuerden (zum Durchstreichen). */
function singleFor(sb: 0 | 1 | 2) {
  return days.value ? sb * soundboxRentalCents(from.value, to.value) : soundboxDayCents(sb, 'moDo')
}
const sbOptions = [
  { n: 0 as const, label: 'Keine' },
  { n: 1 as const, label: '1 Soundbox' },
  { n: 2 as const, label: '2 Soundboxen' },
]
/** Was die Stufe ausser den Ausdrucken bringt, fuer die Auswahlzeile. */
const perks = (p: RentalPackage) =>
  [p.short, p.designIncluded ? 'Fotodesign inkl.' : '', `${p.freeDeliveryKm} km frei`].filter(Boolean).join(' · ')

// Ab Premium ist das eigene Foto-Layout inklusive: dann nicht berechnen.
// Zubehoer, das es noch nicht gibt, steht hier gar nicht erst.
const layoutIncluded = computed(() => !!pkg.value?.designIncluded)
const shopAddons = addons.filter(a => a.available)
const chosenAddons = computed(() => shopAddons.filter(a =>
  chosen.value.includes(a.slug) && !(a.slug === LAYOUT_ADDON && layoutIncluded.value)))
// Zusatzakku nur mit Soundbox, wie bei der Soundbox-Miete: pro Tag.
watch(soundboxes, (sb) => { if (!sb) battery.value = false })
const batteryCents = computed(() => (battery.value && soundboxes.value ? n.value * soundboxRates.extraBatteryPerDayCents : 0))
const extrasTotal = computed(() => chosenAddons.value.reduce((s, a) => s + a.priceCents, 0) + batteryCents.value)

const baseCents = computed(() => (pkg.value ? pkg.value.priceCents * n.value : 0))
const pkgPrice = computed(() => {
  if (!pkg.value) return 0
  return days.value ? packageRangeCents(pkg.value, soundboxes.value, from.value, to.value) : baseCents.value + addFor(soundboxes.value)
})
const total = computed(() => pkgPrice.value + extrasTotal.value)
const deposit = computed(() => depositCents(true, soundboxes.value))

const kurz = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
const knapp = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })
const at = (s: string) => new Date(`${s}T12:00:00`)
/** "Sa., 24.10." bzw. "23.10.–25.10. · 3 Tage" */
const rangeShort = computed(() => {
  if (!days.value) return ''
  if (days.value === 1) return kurz.format(at(from.value))
  return `${knapp.format(at(from.value))}–${knapp.format(at(to.value))} · ${days.value} Tage`
})
const rangeLong = computed(() => {
  if (!days.value) return ''
  if (days.value === 1) return formatEventDate(from.value)
  return `${kurz.format(at(from.value))} – ${kurz.format(at(to.value))} · ${days.value} Tage`
})

// ---- Schritte ----
const steps = useSteps(4)

// Vorwahl aus der Adresse (?paket=, ?sb=) zaehlt als erledigt.
onMounted(() => {
  minDate.value = todayIso()
  if (pkg.value) steps.preset(2)
  if (soundboxes.value) steps.preset(3)
})

// Tage nicht mehr frei (z. B. nach Wahl von 2 Soundboxen): zurueck zu Schritt 1.
watch(rangeOk, (v) => { if (!v) steps.reopen(1) })
watch(paket, (p) => { if (p) steps.complete(2) })
watch(soundboxes, (sb) => {
  emit('focus', `sb${sb}`)
  steps.complete(3)
})

const summaries = computed(() => ({
  1: rangeShort.value,
  2: pkg.value ? `${pkg.value.prints ? `${pkg.value.prints} Ausdrucke` : 'Nur digital'} · ${pkg.value.short}` : '',
  3: sbOptions[soundboxes.value].label,
  4: [...chosenAddons.value.map(a => a.name), ...(battery.value ? ['Zusatzakku'] : [])].join(', ')
    || (layoutIncluded.value ? 'Layout inklusive' : 'Keins'),
}))

const ready = computed(() => steps.allDone.value && !!pkg.value && days.value > 0 && rangeOk.value)

// Auswahl geaendert: Bestaetigung ausblenden, sonst wirkt sie wie ein Fehler.
watch([paket, soundboxes, from, to, chosen, battery], () => { added.value = false }, { deep: true })

const { add } = useCart()

function addToCart() {
  if (!ready.value || !pkg.value) return
  const p = pkg.value
  const sbText = soundboxes.value ? `mit ${soundboxes.value} Soundbox${soundboxes.value > 1 ? 'en' : ''}` : 'ohne Soundbox'
  const dayText = days.value > 1 ? `, ${days.value} Tage` : ''
  add([
    {
      kind: 'package', slug: p.slug, name: p.name, detail: sbText + dayText,
      unitPriceCents: pkgPrice.value, quantity: 1, from: from.value, to: to.value,
      freeDeliveryKm: p.freeDeliveryKm, deposit: { fotobox: true, soundboxes: soundboxes.value },
    },
    ...chosenAddons.value.map(a => ({
      kind: 'addon' as const, slug: a.slug, name: a.name,
      unitPriceCents: a.priceCents, quantity: 1, from: from.value, to: to.value, freeDeliveryKm: 0,
    })),
    ...(batteryCents.value
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
    <h2 class="label bk__h">Fotobox buchen</h2>

    <div class="bk__steps">
      <BookingStep :n="1" title="Wann ist Ihre Feier?" :state="steps.state(1)" :summary="summaries[1]" @open="steps.open(1)">
        <ClientOnly>
          <DateCalendar
            v-model="from" v-model:to="to" v-model:ok="rangeOk" range
            :min="minDate" :soundboxes="soundboxes"
          />
          <template #fallback><div class="bk__cal-ph" /></template>
        </ClientOnly>
        <!-- Ein Klick waehlt einen Tag. Dass ein zweiter Klick den Zeitraum
             verlaengert, sieht man sonst nicht. -->
        <p v-if="days === 1" class="bk__small muted bk__tip">Mehrere Tage? Letzten Tag anklicken.</p>
        <div class="bk__row">
          <span v-if="days" class="bk__small">{{ rangeLong }}</span>
          <UiButton variant="solid" size="sm" class="bk__next" :disabled="!days || !rangeOk" @click="steps.complete(1)">
            Weiter <UiIcon name="arrow" :size="14" />
          </UiButton>
        </div>
      </BookingStep>

      <BookingStep :n="2" title="Ausdrucke" :state="steps.state(2)" :summary="summaries[2]" @open="steps.open(2)">
        <div class="opts" role="radiogroup" aria-label="Ausdrucke">
          <label v-for="p in bookable" :key="p.slug" class="opt" :class="{ 'is-sel': paket === p.slug }">
            <input v-model="paket" type="radio" name="bk-paket" :value="p.slug">
            <span class="opt__main">
              <span class="opt__name">{{ p.prints ? `${p.prints} Ausdrucke` : 'Nur digital' }}</span>
              <span class="opt__sub">{{ perks(p) }}</span>
            </span>
            <span class="opt__price">
              <span>{{ formatPrice(p.priceCents * n) }}</span>
              <span v-if="n > 1" class="opt__was">{{ n }} × {{ formatPrice(p.priceCents) }}</span>
            </span>
          </label>
        </div>
      </BookingStep>

      <BookingStep :n="3" title="Soundbox dazu" :state="steps.state(3)" :summary="summaries[3]" @open="steps.open(3)">
        <div class="opts" role="radiogroup" aria-label="Soundbox dazu">
          <label v-for="o in sbOptions" :key="o.n" class="opt" :class="{ 'is-sel': soundboxes === o.n }">
            <input v-model="soundboxes" type="radio" name="bk-sb" :value="o.n">
            <span class="opt__name">{{ o.label }}</span>
            <span v-if="o.n" class="opt__price">
              <span>+ {{ isFrom ? 'ab ' : '' }}{{ formatPrice(addFor(o.n)) }}</span>
              <!-- Nur wenn einzeln wirklich teurer waere. Ueber mehrere Wochenendtage
                   kann die Soundbox-Pauschale guenstiger sein als der Kombi-Aufpreis. -->
              <s v-if="singleFor(o.n) > addFor(o.n)" class="opt__was" :aria-label="`einzeln ${formatPrice(singleFor(o.n))}`">{{ formatPrice(singleFor(o.n)) }}</s>
            </span>
          </label>
        </div>
        <!-- "Keine" ist vorausgewaehlt, ein Klick darauf aendert nichts:
             deshalb braucht dieser Schritt einen eigenen Weiter-Knopf. -->
        <UiButton variant="solid" size="sm" class="bk__next" @click="steps.complete(3)">
          Weiter <UiIcon name="arrow" :size="14" />
        </UiButton>
      </BookingStep>

      <BookingStep :n="4" title="Zubehör" :state="steps.state(4)" :summary="summaries[4]" @open="steps.open(4)">
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
          <li v-if="soundboxes">
            <label class="check">
              <input v-model="battery" type="checkbox">
              <span class="bk__addon">
                <span>Zusatzakku für die Soundbox</span>
                <span class="bk__addon-price">+ {{ formatPrice(n * soundboxRates.extraBatteryPerDayCents) }}</span>
              </span>
            </label>
          </li>
        </ul>
        <UiButton variant="solid" size="sm" class="bk__next" @click="steps.complete(4)">
          Weiter <UiIcon name="arrow" :size="14" />
        </UiButton>
      </BookingStep>
    </div>

    <dl v-if="pkg" class="bk__sum">
      <div>
        <dt>Fotobox {{ pkg.short }}<template v-if="n > 1">, {{ n }} Tage</template></dt>
        <dd>{{ formatPrice(baseCents) }}</dd>
      </div>
      <div v-if="soundboxes">
        <dt>{{ soundboxes }} Soundbox{{ soundboxes > 1 ? 'en' : '' }}</dt>
        <dd>+ {{ formatPrice(pkgPrice - baseCents) }}</dd>
      </div>
      <div v-for="a in chosenAddons" :key="a.slug"><dt>{{ a.name }}</dt><dd>+ {{ formatPrice(a.priceCents) }}</dd></div>
      <div v-if="batteryCents"><dt>Zusatzakku</dt><dd>+ {{ formatPrice(batteryCents) }}</dd></div>
      <div class="bk__total">
        <dt>{{ rangeShort || 'Gesamt' }}</dt>
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
