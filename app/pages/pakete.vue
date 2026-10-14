<script setup lang="ts">
import type { RentalPackage, Weekpart } from '~~/shared/types'
import { addons, fotoboxPackages, KOMBI_RABATT_PCT, soundboxRates } from '~~/shared/catalog'
import { formatPrice, PRICE_PER_KM_CENTS } from '~~/shared/pricing'

useSeoMeta({
  title: 'Pakete & Preise',
  description:
    'Fotobox-Pakete von digital bis 700 Ausdrucke, auf Wunsch mit Soundbox. '
    + 'Alle Preise für Ihr Event in Hamburg.',
})

const toBooking = (p: RentalPackage) => `/produkte/fotobox?paket=${p.slug}#buchen`

// Spalten der Kombi-Tabelle in der Reihenfolge aus Louis' Preisliste.
const kombiCols: { boxes: 1 | 2, part: Weekpart, label: string }[] = [
  { boxes: 1, part: 'moDo', label: 'Mo–Do' },
  { boxes: 1, part: 'frSo', label: 'Fr–So' },
  { boxes: 2, part: 'moDo', label: 'Mo–Do' },
  { boxes: 2, part: 'frSo', label: 'Fr–So' },
]

const soundboxLines = [
  { name: 'Ein Tag, Mo–Do', price: soundboxRates.perDayCents.moDo, unit: 'pro Tag' },
  { name: 'Ein Tag, Fr–So', price: soundboxRates.perDayCents.frSo, unit: 'pro Tag' },
  { name: 'Wochenende, Fr–So', price: soundboxRates.weekendCents, unit: 'insgesamt' },
  { name: 'Woche, Mo–So', price: soundboxRates.weekCents, unit: 'insgesamt' },
  { name: 'Extra-Akku', price: soundboxRates.extraBatteryPerDayCents, unit: 'pro Tag' },
]
</script>

<template>
  <div>
    <PageHero
      crumb="Pakete"
      title="Pakete & Preise."
      sub="Alle Fotobox-Pakete, Kombipreise und Zubehör auf einen Blick."
      image="/images/pakete/banner.webp" image-mobile="/images/pakete/banner-mobil.webp"
      tone="plain" layout="stack" focus="100% 40%"
    />

    <section class="section" aria-labelledby="fotobox-h">
      <div class="shell">
        <header class="pk-head">
          <h2 id="fotobox-h" class="display h-col">Fotobox-Pakete</h2>
          <p class="muted">Preise pro Veranstaltungstag.</p>
        </header>
        <PackageCards :packages="fotoboxPackages" :to="toBooking" />
      </div>
    </section>

    <section class="section pk-sec" aria-labelledby="kombi-h">
      <div class="shell">
        <header class="pk-head">
          <h2 id="kombi-h" class="display h-col">Fotobox mit Soundbox</h2>
          <p class="muted">Im Kombipaket sparen Sie rund {{ KOMBI_RABATT_PCT }} %.</p>
        </header>

        <div class="kombi" role="region" aria-labelledby="kombi-h" tabindex="0">
          <table class="kombi__table">
            <thead>
              <tr>
                <th rowspan="2" scope="col" class="label">Paket</th>
                <th colspan="2" scope="colgroup" class="label">+ 1 Soundbox</th>
                <th colspan="2" scope="colgroup" class="label">+ 2 Soundboxen</th>
              </tr>
              <tr>
                <th v-for="c in kombiCols" :key="`${c.boxes}${c.part}`" scope="col" class="kombi__day">
                  {{ c.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in fotoboxPackages" :key="p.slug">
                <th scope="row" class="display kombi__name">{{ p.short }}</th>
                <td v-for="c in kombiCols" :key="`${c.boxes}${c.part}`">
                  {{ p.withSoundbox ? formatPrice(p.withSoundbox[c.boxes][c.part]) : '–' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="notes muted">
          <li>Mo–Do und Fr–So beziehen sich auf den Miettag.</li>
          <li>Der Kombirabatt gilt nur für Tagesmieten. Zubehör und Lieferung sind nicht rabattiert.</li>
        </ul>
      </div>
    </section>

    <section class="section pk-sec">
      <div class="shell cols">
        <div aria-labelledby="sb-h">
          <header class="pk-head pk-head--tight">
            <h2 id="sb-h" class="display h-col">Soundbox einzeln</h2>
            <p class="muted">Preise pro Box.</p>
          </header>
          <ul class="price">
            <li v-for="l in soundboxLines" :key="l.name">
              <span>{{ l.name }}</span>
              <span class="price__dots" aria-hidden="true" />
              <span class="price__val">{{ formatPrice(l.price) }} <small>{{ l.unit }}</small></span>
            </li>
          </ul>
          <NuxtLink to="/produkte/soundbox#buchen" class="label more">
            Soundbox buchen <UiIcon name="arrow" :size="12" />
          </NuxtLink>
        </div>

        <div aria-labelledby="zub-h">
          <header class="pk-head pk-head--tight">
            <h2 id="zub-h" class="display h-col">Zubehör</h2>
            <p class="muted">Zur Fotobox dazubuchbar.</p>
          </header>
          <ul class="price">
            <li v-for="a in addons" :key="a.slug" :class="{ 'is-off': !a.available }">
              <span>{{ a.name }}</span>
              <span class="price__dots" aria-hidden="true" />
              <span class="price__val">
                <template v-if="a.available">{{ formatPrice(a.priceCents) }}</template>
                <small v-else>bald</small>
              </span>
            </li>
          </ul>
          <p class="notes muted">
            Ein eigenes Fotodesign ist bei Premium, Premium Plus und Deluxe inklusive.
          </p>
        </div>
      </div>
    </section>

    <section class="section pk-sec">
      <div class="shell ask">
        <div>
          <h2 class="display ask__h">Lieferung</h2>
          <p class="muted">
            Je nach Paket liefern wir bis 4 oder 8 km ohne Aufpreis.
            Jeder weitere Kilometer kostet {{ formatPrice(PRICE_PER_KM_CENTS) }}.
          </p>
        </div>
        <div>
          <h2 class="display ask__h">Noch unsicher?</h2>
          <p class="muted">Schreiben Sie uns, wir finden das passende Paket für Ihre Feier.</p>
          <UiButton to="/kontakt" variant="ghost" size="sm" class="ask__btn">
            Kontakt aufnehmen <UiIcon name="arrow" :size="14" />
          </UiButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pk-head { display: grid; gap: var(--s-3); margin-bottom: var(--s-7); }
.pk-head--tight { margin-bottom: var(--s-5); }

/* Folgeabschnitte nur durch eine Haarlinie getrennt, wie in einer Preisliste. */
.pk-sec { padding-top: 0; }
.pk-sec .shell { border-top: 1px solid var(--c-gold-hair); padding-top: var(--section-y); }

/* Kombi-Tabelle: auf dem Handy seitlich scrollbar, Paketname bleibt stehen. */
.kombi { overflow-x: auto; }
.kombi__table {
  width: 100%; min-width: 34rem;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.kombi__table th, .kombi__table td {
  padding: var(--s-3) var(--s-4);
  text-align: right; white-space: nowrap;
  border-bottom: 1px solid var(--c-gold-hair);
}
.kombi__table thead th { color: var(--c-text-muted); font-weight: 500; }
.kombi__table thead tr:first-child th { border-bottom: 0; padding-bottom: 0; }
.kombi__table thead th[colspan] { text-align: center; color: var(--c-gold); }
.kombi__table thead th[rowspan] { vertical-align: bottom; }
.kombi__day { font-size: var(--t-small); }
.kombi__table th:first-child {
  position: sticky; left: 0; background: var(--c-paper);
  text-align: left; padding-left: 0;
}
.kombi__name { font-size: 1.35rem; font-weight: 400; }
/* Trennlinie zwischen einer und zwei Soundboxen */
.kombi__table tbody td:nth-child(4),
.kombi__table thead tr:last-child th:nth-child(3),
.kombi__table thead tr:first-child th:last-child { border-left: 1px solid var(--c-gold-hair); }

.notes { list-style: none; padding: 0; margin: var(--s-5) 0 0; font-size: var(--t-small); display: grid; gap: var(--s-1); }

.cols { display: grid; gap: var(--s-8); }
@media (min-width: 860px) { .cols { grid-template-columns: 1fr 1fr; } }

/* Preiszeilen mit Punktlinie zwischen Name und Preis */
.price { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-3); }
.price li { display: flex; align-items: baseline; gap: var(--s-2); }
.price__dots { flex: 1; border-bottom: 1px dotted var(--c-gold-hair); transform: translateY(-0.3em); min-width: 1rem; }
.price__val { font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap; }
.price__val small { display: inline-block; min-width: 4.5em; font-weight: 400; color: var(--c-text-muted); font-size: 0.75rem; }
.price li.is-off { color: var(--c-text-muted); }
.price li.is-off small { min-width: 0; }

.more {
  display: inline-flex; align-items: center; gap: 0.3rem;
  margin-top: var(--s-5); color: var(--c-gold);
}

.ask { display: grid; gap: var(--s-7) var(--s-8); }
@media (min-width: 860px) { .ask { grid-template-columns: 1fr 1fr; } }
.ask__h { font-size: var(--t-h3); margin-bottom: var(--s-2); }
.ask__btn { margin-top: var(--s-4); }
</style>
