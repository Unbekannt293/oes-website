<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { CartLine, DeliveryQuote } from '~~/shared/types'
import type { Korbzeile } from '~~/shared/schemas'
import { kontaktSchema, lieferadresseSchema } from '~~/shared/schemas'
import { formatPrice, PRICE_PER_KM_CENTS } from '~~/shared/pricing'

// Kasse nach Louis' Brief: Adresse (daraus die Fahrtkosten), Kontakt,
// Zahlungsart, dann Mietvertrag bestaetigen und "Zahlungspflichtig bestellen".
// Gleiche Schritte wie im Buchungskasten (BookingStep + useSteps).
// Preise und Fahrtkosten rechnet der Server; was hier steht, ist Anzeige.
useSeoMeta({ title: 'Kasse', robots: 'noindex, follow' })

const { lines, loaded, subtotal, deposit, clear } = useCart()
const config = useRuntimeConfig()
const contact = useContact()

/** Bestellnummer nach erfolgreicher Bestellung, oeffnet das Danke-Fenster. */
const bestellt = ref<string | null>(null)

// Leerer Korb (z. B. direkt aufgerufen): zurueck zum Warenkorb.
watch([loaded, () => lines.value.length], ([l, n]) => {
  if (l && !n && !bestellt.value) navigateTo('/warenkorb')
}, { immediate: true })

/** Was an den Server geht: nur die Auswahl, keine Preise. */
const zeilen = computed<Korbzeile[]>(() => lines.value.map((l: CartLine) => ({
  group: l.group, kind: l.kind, slug: l.slug, quantity: l.quantity, from: l.from, to: l.to,
  soundboxes: l.kind === 'package' ? (l.deposit?.soundboxes ?? 0) : 0,
})))

const steps = useSteps(4)

// ---- 1 Lieferadresse ----
const adresse = reactive({ strasse: '', plz: '', ort: 'Hamburg', zusatz: '' })
const adresseFehler = reactive<Record<string, string | undefined>>({})
// offen: Entfernungsdienst nicht erreichbar, Fahrtkosten nach Absprache.
type Lieferung = { offen: true } | { offen: false, distanceKm: number, label: string, quote: DeliveryQuote }
const lieferung = ref<Lieferung | null>(null)
const lieferungStatus = ref<'idle' | 'laedt' | 'fehler'>('idle')
const lieferungMeldung = ref('')

async function adresseWeiter() {
  for (const k of Object.keys(adresseFehler)) delete adresseFehler[k]
  const r = lieferadresseSchema.safeParse(adresse)
  if (!r.success) {
    for (const i of r.error.issues) adresseFehler[String(i.path[0])] ??= i.message
    return
  }
  lieferungStatus.value = 'laedt'
  try {
    lieferung.value = await $fetch('/api/lieferung', { method: 'POST', body: { ...r.data, zeilen: zeilen.value } })
    lieferungStatus.value = 'idle'
    steps.complete(1)
  }
  catch (err) {
    const e = err as FetchError
    lieferungStatus.value = 'fehler'
    lieferungMeldung.value = e.statusCode === 422
      ? 'Diese Adresse haben wir nicht gefunden. Bitte Straße, Hausnummer und PLZ prüfen.'
      : 'Die Entfernung konnte gerade nicht berechnet werden. Bitte später erneut versuchen.'
  }
}
// Adresse geaendert: Fahrtkosten gelten nicht mehr.
watch(() => [adresse.strasse, adresse.plz, adresse.ort], () => {
  if (lieferung.value) { lieferung.value = null; steps.reopen(1) }
})

// ---- 2 Kontakt ----
const kontakt = reactive({ vorname: '', nachname: '', email: '', telefon: '' })
const kontaktFehler = reactive<Record<string, string | undefined>>({})
function kontaktWeiter() {
  for (const k of Object.keys(kontaktFehler)) delete kontaktFehler[k]
  const r = kontaktSchema.safeParse(kontakt)
  if (!r.success) {
    for (const i of r.error.issues) kontaktFehler[String(i.path[0])] ??= i.message
    return
  }
  steps.complete(2)
}

// ---- 3 Zahlungsart ----
const zahlungsart = ref<'ueberweisung' | 'online'>(config.public.onlinePayment ? 'online' : 'ueberweisung')
const zahlungsLabel = computed(() => (zahlungsart.value === 'online' ? 'Online bezahlen' : 'Überweisung'))

// ---- Zurueck von der Bezahlseite ("abgebrochen") ----
const KASSE_KEY = 'oes-kasse'
const route = useRoute()
const abgebrochen = ref(false)
onMounted(async () => {
  const id = route.query.abgebrochen
  if (typeof id !== 'string') return
  abgebrochen.value = true
  // Angaben wieder einsetzen, Reservierung freigeben (sonst blockiert der
  // offene Bezahlvorgang den Tag noch 30 Minuten).
  try {
    const saved = JSON.parse(sessionStorage.getItem(KASSE_KEY) ?? 'null')
    if (saved) { Object.assign(adresse, saved.adresse); Object.assign(kontakt, saved.kontakt) }
  }
  catch { /* leer lassen */ }
  try { await $fetch('/api/zahlung/abbrechen', { method: 'POST', body: { buchungId: id } }) }
  catch { /* laeuft sonst nach 30 Min. von selbst ab */ }
  navigateTo({ query: {} }, { replace: true })
})

// ---- 4 Pruefen und bestellen ----
const mietvertrag = ref(false)
const vertragFehlt = ref(false)
watch(mietvertrag, (v) => { if (v) vertragFehlt.value = false })
const status = ref<'idle' | 'sendet' | 'fehler'>('idle')
const fehlerText = ref('')

const fahrtkosten = computed(() => (lieferung.value && !lieferung.value.offen ? lieferung.value.quote.feeCents : 0))
const fahrtkostenOffen = computed(() => !!lieferung.value?.offen)
const gesamt = computed(() => subtotal.value + fahrtkosten.value)

async function bestellen() {
  if (!mietvertrag.value) { vertragFehlt.value = true; return }
  status.value = 'sendet'
  try {
    const r = await $fetch<{ nummer: string, url?: string }>('/api/bestellung', {
      method: 'POST',
      body: { adresse, kontakt, zahlungsart: zahlungsart.value, zeilen: zeilen.value, mietvertrag: true },
    })
    if (r.url) {
      // Online: weiter zur Bezahlseite von Stripe. Korb bleibt bis zur Zahlung,
      // die Angaben merken wir uns fuer den Fall, dass jemand zurueckkommt.
      try { sessionStorage.setItem(KASSE_KEY, JSON.stringify({ adresse, kontakt })) }
      catch { /* dann eben neu eintippen */ }
      window.location.href = r.url
      return
    }
    bestellt.value = r.nummer
    status.value = 'idle'
    clear()
  }
  catch (err) {
    const e = err as FetchError<{ data?: { tag?: string } }>
    status.value = 'fehler'
    fehlerText.value = e.statusCode === 409
      ? `Am ${e.data?.data?.tag ? formatEventDate(e.data.data.tag) : 'gewählten Tag'} ist inzwischen nicht mehr alles frei. Bitte im Warenkorb einen anderen Tag wählen.`
      : 'Die Bestellung konnte gerade nicht abgeschickt werden. Bitte später erneut versuchen oder uns anrufen.'
  }
}

const summaries = computed(() => ({
  1: lieferung.value ? `${adresse.strasse}, ${adresse.plz} ${adresse.ort}${lieferung.value.offen ? ' · Fahrtkosten nach Absprache' : ''}` : '',
  2: `${kontakt.vorname} ${kontakt.nachname}`,
  3: zahlungsLabel.value,
}))
const a11y = (fehler: Record<string, string | undefined>, f: string) => ({
  'aria-invalid': fehler[f] ? 'true' : undefined,
  'aria-describedby': fehler[f] ? `${f}-fehler` : undefined,
})
</script>

<template>
  <div>
  <PageHero crumb="Kasse" title="Kasse" :trail="[{ to: '/warenkorb', label: 'Warenkorb' }]" slim />
  <div class="section shell ks__page">

    <p v-if="abgebrochen && lines.length" class="ks__info" role="status">
      <UiIcon name="info" :size="16" />
      Die Zahlung wurde abgebrochen, es wurde nichts berechnet. Ihre Angaben sind noch da,
      Sie können es einfach noch einmal versuchen.
    </p>

    <div v-if="!loaded" class="ks__wait" aria-hidden="true" />

    <div v-else-if="lines.length" class="ks">
      <div class="ks__main">
        <BookingStep :n="1" title="Lieferadresse" :state="steps.state(1)" :summary="summaries[1]" @open="steps.open(1)">
          <form class="ks__form" novalidate @submit.prevent="adresseWeiter">
            <UiField id="strasse" label="Straße und Hausnummer" :error="adresseFehler.strasse">
              <input id="strasse" v-model="adresse.strasse" class="control ks__big" autocomplete="street-address" v-bind="a11y(adresseFehler, 'strasse')">
            </UiField>
            <div class="ks__row">
              <UiField id="plz" label="PLZ" :error="adresseFehler.plz">
                <input id="plz" v-model="adresse.plz" class="control ks__big" inputmode="numeric" autocomplete="postal-code" maxlength="5" v-bind="a11y(adresseFehler, 'plz')">
              </UiField>
              <UiField id="ort" label="Ort" :error="adresseFehler.ort">
                <input id="ort" v-model="adresse.ort" class="control ks__big" autocomplete="address-level2" v-bind="a11y(adresseFehler, 'ort')">
              </UiField>
            </div>
            <UiField id="zusatz" label="Zusätzliche Adressinformation" optional>
              <input id="zusatz" v-model="adresse.zusatz" class="control" placeholder="z. B. Hinterhof, Etage, Ansprechpartner vor Ort">
            </UiField>
            <p v-if="lieferungStatus === 'fehler'" class="ks__err" role="alert">
              <UiIcon name="alert" :size="14" /> {{ lieferungMeldung }}
            </p>
            <UiButton variant="solid" size="sm" class="ks__next" :disabled="lieferungStatus === 'laedt'">
              <template v-if="lieferungStatus === 'laedt'">Fahrtkosten werden berechnet …</template>
              <template v-else>Fahrtkosten berechnen <UiIcon name="arrow" :size="14" /></template>
            </UiButton>
          </form>
        </BookingStep>

        <BookingStep :n="2" title="Kontaktdaten" :state="steps.state(2)" :summary="summaries[2]" @open="steps.open(2)">
          <form class="ks__form" novalidate @submit.prevent="kontaktWeiter">
            <div class="ks__row">
              <UiField id="vorname" label="Vorname" :error="kontaktFehler.vorname">
                <input id="vorname" v-model="kontakt.vorname" class="control" autocomplete="given-name" v-bind="a11y(kontaktFehler, 'vorname')">
              </UiField>
              <UiField id="nachname" label="Nachname" :error="kontaktFehler.nachname">
                <input id="nachname" v-model="kontakt.nachname" class="control" autocomplete="family-name" v-bind="a11y(kontaktFehler, 'nachname')">
              </UiField>
            </div>
            <div class="ks__row">
              <UiField id="email" label="E-Mail" :error="kontaktFehler.email">
                <input id="email" v-model="kontakt.email" class="control" type="email" inputmode="email" autocomplete="email" v-bind="a11y(kontaktFehler, 'email')">
              </UiField>
              <UiField id="telefon" label="Telefon" :error="kontaktFehler.telefon">
                <input id="telefon" v-model="kontakt.telefon" class="control" type="tel" inputmode="tel" autocomplete="tel" v-bind="a11y(kontaktFehler, 'telefon')">
              </UiField>
            </div>
            <UiButton variant="solid" size="sm" class="ks__next">Weiter <UiIcon name="arrow" :size="14" /></UiButton>
          </form>
        </BookingStep>

        <BookingStep :n="3" title="Zahlungsart" :state="steps.state(3)" :summary="summaries[3]" @open="steps.open(3)">
          <div class="opts" role="radiogroup" aria-label="Zahlungsart">
            <label class="opt" :class="{ 'is-sel': zahlungsart === 'online', 'is-off': !config.public.onlinePayment }">
              <input v-model="zahlungsart" type="radio" name="zahlung" value="online" :disabled="!config.public.onlinePayment">
              <span class="opt__main">
                <span class="opt__name">Online bezahlen</span>
                <span class="opt__sub">Karte, PayPal, Apple Pay, Google Pay, Klarna</span>
              </span>
              <span v-if="!config.public.onlinePayment" class="ks__soon">bald</span>
            </label>
            <label class="opt" :class="{ 'is-sel': zahlungsart === 'ueberweisung' }">
              <input v-model="zahlungsart" type="radio" name="zahlung" value="ueberweisung">
              <span class="opt__main">
                <span class="opt__name">Überweisung</span>
                <span class="opt__sub">Die Bankverbindung steht auf der Rechnung.</span>
              </span>
            </label>
          </div>
          <UiButton variant="solid" size="sm" class="ks__next" @click="steps.complete(3)">Weiter <UiIcon name="arrow" :size="14" /></UiButton>
        </BookingStep>

        <BookingStep :n="4" title="Prüfen und bestellen" :state="steps.state(4)" @open="steps.open(4)">
          <div class="ks__final">
            <!-- Louis: Vertragskasten rot, wenn ohne Zustimmung bestellt wird. -->
            <div class="ks__vertrag" :class="{ 'is-err': vertragFehlt }">
              <label class="check">
                <input v-model="mietvertrag" type="checkbox" :aria-invalid="vertragFehlt || undefined" aria-describedby="vertrag-fehler">
                <span>
                  Ich habe den <NuxtLink to="/agb" target="_blank">Mietvertrag</NuxtLink> gelesen
                  und akzeptiere dessen Bedingungen.
                </span>
              </label>
              <p v-if="vertragFehlt" id="vertrag-fehler" class="ks__err">
                <UiIcon name="alert" :size="14" /> Bitte bestätigen Sie den Mietvertrag.
              </p>
            </div>

            <p v-if="status === 'fehler'" class="ks__fail" role="alert">
              <UiIcon name="alert" :size="16" /> {{ fehlerText }}
              <a :href="`tel:${contact.phoneRaw}`">{{ contact.phone }}</a>
            </p>

            <UiButton variant="solid" size="lg" class="ks__buy" :disabled="status === 'sendet'" @click="bestellen">
              <template v-if="status === 'sendet'">Wird bestellt …</template>
              <template v-else>Zahlungspflichtig bestellen</template>
            </UiButton>
          </div>
        </BookingStep>
      </div>

      <aside class="ks__sum">
        <p class="label ks__sum-h">Ihre Bestellung</p>
        <ul class="ks__items">
          <li v-for="l in lines" :key="l.id" :class="{ 'is-addon': l.kind === 'addon' }">
            <span>{{ l.kind === 'addon' ? '+ ' : '' }}{{ l.quantity > 1 ? `${l.quantity} × ` : '' }}{{ l.name }}</span>
            <span>{{ formatPrice(l.unitPriceCents * l.quantity) }}</span>
          </li>
        </ul>
        <dl>
          <div><dt>Zwischensumme</dt><dd>{{ formatPrice(subtotal) }}</dd></div>
          <div>
            <dt>Fahrtkosten<template v-if="lieferung && !lieferung.offen"> ({{ lieferung.distanceKm.toLocaleString('de-DE') }} km)</template></dt>
            <dd>{{ !lieferung ? 'nach Adresse' : lieferung.offen ? 'nach Absprache' : formatPrice(fahrtkosten) }}</dd>
          </div>
          <div class="ks__total"><dt>Gesamt<template v-if="fahrtkostenOffen"> zzgl. Fahrtkosten</template></dt><dd>{{ formatPrice(gesamt) }}</dd></div>
          <div class="muted"><dt>zzgl. Kaution</dt><dd>{{ formatPrice(deposit) }}</dd></div>
        </dl>
        <p v-if="fahrtkostenOffen" class="ks__note ks__note--offen">
          <UiIcon name="info" :size="14" />
          <span>Die Fahrtkosten konnten gerade nicht automatisch berechnet werden. Sie können
            trotzdem bestellen, wir teilen Ihnen die Fahrtkosten danach mit.</span>
        </p>
        <p class="ks__note muted">
          Lieferung im Freiradius kostenlos, danach {{ formatPrice(PRICE_PER_KM_CENTS) }} pro km.
        </p>
      </aside>
    </div>

    <!-- Danke-Fenster nach der Bestellung (Louis' Brief). -->
    <div v-if="bestellt" class="ks__done-bg" role="dialog" aria-modal="true" aria-labelledby="danke-h">
      <div class="ks__done">
        <span class="ks__done-icon"><UiIcon name="check" :size="26" /></span>
        <h2 id="danke-h" class="display ks__done-h">Danke für Ihre Bestellung!</h2>
        <p class="muted">Bestellnummer <strong>{{ bestellt }}</strong></p>
        <p>
          Sie erhalten in Kürze eine Bestellbestätigung, die Rechnung und noch
          einmal den Mietvertrag per E-Mail.
        </p>
        <UiButton to="/" variant="solid">Zur Startseite</UiButton>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
@import '~/components/product/booking.css';

.ks__page { padding-top: var(--s-7); }
.ks__info {
  display: flex; align-items: start; gap: 0.5rem; margin-bottom: var(--s-5);
  padding: var(--s-3) var(--s-4); font-size: var(--t-small);
  background: rgb(195 139 55 / 0.08); border-left: 2px solid var(--c-gold);
}
.ks__info svg { flex: none; margin-top: 0.15rem; color: var(--c-gold); }
.ks__wait { min-height: 40vh; }

.ks { display: grid; gap: var(--s-7); align-items: start; }
@media (min-width: 960px) { .ks { grid-template-columns: minmax(0, 1fr) 360px; } }

.ks__main {
  padding: var(--s-2) var(--s-5) var(--s-3);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.ks__form { display: grid; gap: var(--s-4); padding-top: var(--s-2); }
.ks__row { display: grid; gap: var(--s-4); }
@media (min-width: 560px) { .ks__row { grid-template-columns: 1fr 1fr; } }
/* Louis: Adressfeld deutlicher, damit man sieht, dass es Pflicht ist. */
.ks__big { border-width: 1.5px; }
.ks__next { justify-self: end; }
.ks__err { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; color: var(--c-danger); }
.ks__soon { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--c-text-muted); }
.opt.is-off { cursor: default; opacity: 0.6; }
.opt.is-off:hover { border-color: var(--c-gold-hair); }
.opts + .ks__next { display: flex; width: fit-content; margin: var(--s-4) 0 0 auto; }

.ks__final { display: grid; gap: var(--s-4); padding-top: var(--s-2); }
.ks__vertrag { display: grid; gap: var(--s-2); padding: var(--s-4); border: 1px solid var(--c-gold-hair); border-radius: var(--r-sm); transition: border-color var(--d-fast) var(--e-out), background var(--d-fast) var(--e-out); }
.ks__vertrag.is-err { border-color: var(--c-danger); background: rgb(192 57 43 / 0.06); }
.ks__fail { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; font-size: var(--t-small); color: var(--c-danger); }
.ks__fail a { color: var(--c-text); text-decoration: underline; }
.ks__buy { width: 100%; }

.ks__sum {
  display: grid; gap: var(--s-4);
  padding: var(--s-6) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.ks__sum-h { color: var(--c-text); }
.ks__items { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-2); font-size: var(--t-small); }
.ks__items li { display: flex; justify-content: space-between; gap: var(--s-3); }
.ks__items li.is-addon { color: var(--c-text-muted); font-size: 0.8125rem; }
.ks__sum dl { display: grid; gap: var(--s-2); margin: 0; padding-top: var(--s-3); border-top: 1px solid var(--c-gold-hair); font-size: var(--t-small); }
.ks__sum dl > div { display: flex; justify-content: space-between; gap: var(--s-3); }
.ks__sum dd { margin: 0; white-space: nowrap; }
.ks__total { font-size: 1.1rem; font-weight: 600; padding-top: var(--s-2); border-top: 1px solid var(--c-gold-hair); }
.ks__total dd { color: var(--c-gold); }
.ks__note { font-size: 0.8125rem; }
.ks__note--offen { display: flex; gap: 0.4rem; align-items: start; padding: var(--s-3); background: rgb(195 139 55 / 0.08); border-left: 2px solid var(--c-gold); }
.ks__note--offen svg { flex: none; margin-top: 0.15rem; color: var(--c-gold); }

.ks__done-bg {
  position: fixed; inset: 0; z-index: 100;
  display: grid; place-items: center; padding: var(--s-5);
  background: rgb(0 0 0 / 0.55);
}
.ks__done {
  display: grid; justify-items: center; gap: var(--s-3); text-align: center;
  max-width: 28rem; padding: var(--s-7) var(--s-6);
  background: var(--c-paper-pure); border-radius: var(--r-md); box-shadow: var(--shadow-card);
}
.ks__done-icon {
  display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%;
  color: var(--c-gold); border: 1px solid var(--c-gold-hair);
}
.ks__done-h { font-size: var(--t-h3); }
</style>
