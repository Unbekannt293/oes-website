<script setup lang="ts">
import { categories, findProduct, fotoboxPackages } from '~~/shared/catalog'
import { BEZUG_NACH_SOUNDBOXEN, type Bezug } from '~~/shared/bewertungen'
import { formatPrice } from '~~/shared/pricing'

const route = useRoute()
const product = computed(() => findProduct(route.params.slug as string))

// Unbekannter Slug muss 404 liefern, nicht eine leere Seite.
// Sonst indexiert Google Muell.
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produkt nicht gefunden', fatal: true })
}

const category = computed(() =>
  categories.find(c => c.id === product.value!.category),
)

// Bewertungen gibt es fuer die buchbaren Produkte. Auf der Fotobox-Seite
// gehoeren sie zur gewaehlten Soundbox-Zahl: Fotobox allein oder eines der
// Komplettpakete, jedes mit eigenen Bewertungen.

// Vorwahl aus der Adresse: ?paket=fotobox-premium oder ?sb=1 (Kombi-Karten
// der Pakete-Seite). Die Stufe laesst sich auch im Vergleich unten waehlen.
const paket = ref(typeof route.query.paket === 'string' ? route.query.paket : '')
const sb = Number(route.query.sb)
const soundboxes = ref<0 | 1 | 2>(sb === 1 || sb === 2 ? sb : 0)
const { lenis } = useLenis()

const reviewBezug = computed<Bezug | null>(() => {
  const slug = product.value!.slug
  if (slug === 'fotobox') return BEZUG_NACH_SOUNDBOXEN[soundboxes.value]
  return slug === 'soundbox' ? 'soundbox' : null
})

// Fotobox: Fotos mit 1 bzw. 2 Soundboxen nur, wenn genau das gewaehlt ist
// (Lukas, 11.11.2026). Sonst sieht man Soundboxen, die man gar nicht bucht.
const galerie = computed(() => {
  const p = product.value!
  const nurBei = Object.entries(p.imageFor ?? {}).filter(([k]) => /^sb[12]$/.test(k))
  return p.images.filter((_, i) => !nurBei.some(([k, idx]) => idx === i && k !== `sb${soundboxes.value}`))
})

// Auswahl im Buchungskasten -> passendes Foto (product.imageFor im Katalog).
// nextTick: die Galerie bekommt bei Soundbox-Wahl erst neue Bilder.
const gallery = ref<{ go: (i: number) => void } | null>(null)
function showImage(key: string) {
  const i = product.value?.imageFor?.[key]
  if (i === undefined) return
  const src = product.value!.images[i]!
  nextTick(() => {
    const j = galerie.value.indexOf(src)
    if (j >= 0) gallery.value?.go(j)
  })
}

function choose(slug: string) {
  paket.value = slug
  const box = document.getElementById('buchen')
  if (!box) return
  // Nur scrollen, wenn der Buchungskasten gar nicht zu sehen ist (Handy).
  const r = box.getBoundingClientRect()
  if (r.bottom > 0 && r.top < innerHeight) return
  // Mit Lenis ueber Lenis scrollen, sonst arbeiten zwei Scroller gegeneinander.
  if (lenis.value) lenis.value.scrollTo(box, { offset: -110 })
  else box.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

useSeoMeta({
  title: () => product.value!.name,
  description: () => product.value!.summary,
})
</script>

<template>
  <div v-if="product" class="section shell">
    <nav class="crumbs label" aria-label="Brotkrumen">
      <NuxtLink to="/">Startseite</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink to="/produkte">Produkte</NuxtLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page" class="crumbs__here">{{ product.name }}</span>
    </nav>

    <div class="pd" :class="{ 'pd--pakete': product.available && product.booking }">
      <div class="pd__gallery">
        <ProductGallery
          v-if="product.images.length" ref="gallery" :images="galerie" :alt="product.name"
          thumbs eager :width="1254" :height="1254"
        />
        <div v-else class="pd__empty" aria-hidden="true">
          <UiIcon name="funke" :size="96" class="pd__empty-funke" />
        </div>
      </div>

      <div class="pd__info">
        <p class="label pd__cat">{{ category?.label }}</p>
        <h1 class="display pd__name">{{ product.name }}</h1>
        <p v-if="product.modell" class="label pd__modell">Modell: {{ product.modell }}</p>
        <p v-if="product.summary" class="pd__summary">{{ product.summary }}</p>

        <ul v-if="product.features.length" class="pd__features">
          <li v-for="f in product.features" :key="f">
            <span class="pd__tick"><UiIcon name="check" :size="14" /></span>{{ f }}
          </li>
        </ul>

        <p v-if="product.available" class="pd__price">
          <span class="muted">ab</span> {{ formatPrice(product.priceCents) }}
          <span class="muted pd__unit">{{ product.priceUnit ?? 'pro Veranstaltung' }}</span>
        </p>
      </div>

      <aside id="buchen" class="pd__aside">
        <BookingPackage
          v-if="product.available && product.booking === 'paket'"
          v-model:paket="paket" v-model:soundboxes="soundboxes" @focus="showImage"
        />
        <BookingRental v-else-if="product.available && product.booking === 'zeitraum'" :product="product" @focus="showImage" />
        <div v-else class="pd__soon">
          <p class="label pd__soon-h">Coming soon</p>
          <p>Dieses Produkt ist bald bei uns verfügbar. Wir merken Sie gern vor.</p>
          <UiButton to="/kontakt" variant="solid">Vormerken lassen</UiButton>
        </div>

        <ReviewSummary />
        <AskBox />
      </aside>

      <!-- Unter der Galerie ist Platz: dort steht der Vergleich der
           Druckstufen, ein Klick auf eine Spalte waehlt sie im Buchungskasten. -->
      <section v-if="product.available && product.booking === 'paket'" class="pd__pakete" aria-labelledby="pakete-h">
        <h2 id="pakete-h" class="display pd__pakete-h">Fotobox-Pakete</h2>
        <PackageCompare :packages="fotoboxPackages" :selected="paket" @select="choose" />
      </section>

      <!-- Soundbox: Wer auch eine Fotobox will, bucht sie ueber die Fotobox
           bzw. ein Kombi-Paket, nicht hier. Das soll man sofort sehen. -->
      <section v-else-if="product.available && product.booking === 'zeitraum'" class="pd__pakete pd__kombi">
        <NuxtImg
          src="/images/produkte/set-fotobox-soundbox-drucker.webp" alt="" width="240" height="240"
          class="pd__kombi-img" loading="lazy"
        />
        <div class="pd__kombi-text">
          <h2 class="display pd__pakete-h">Fotobox dazu?</h2>
          <UiHinweis>Im Paket ist die Soundbox günstiger als einzeln gemietet.</UiHinweis>
          <p class="muted">Fotobox und Soundbox buchen Sie zusammen als Event-Komplettpaket.</p>
          <div class="pd__kombi-links">
            <UiButton to="/pakete" variant="solid" size="sm">Event-Komplettpakete</UiButton>
            <NuxtLink to="/produkte/fotobox" class="label pd__kombi-link">Zur Fotobox <UiIcon name="arrow" :size="12" /></NuxtLink>
          </div>
        </div>
      </section>

      <!-- Ausfuehrliche Beschreibung von Louis: Text, Ausstattung, wofuer. -->
      <!-- Erst zugeklappt (Lukas, 11.11.2026), wie die Textfassung der Rechtstexte. -->
      <UiAufklapper
        v-if="product.beschreibung" gross class="pd__desc"
        titel="Produktbeschreibung" untertitel="Ausstattung, technische Daten und wofür sie sich eignet"
      >
        <h2 class="display pd__desc-titel">{{ product.beschreibung.titel }}</h2>
        <p v-for="(a, i) in product.beschreibung.absaetze" :key="i" class="pd__desc-p">{{ a }}</p>
        <div class="pd__desc-lists">
          <div>
            <h3 class="label pd__desc-h">{{ product.beschreibung.ausstattung.titel }}</h3>
            <ul class="pd__desc-ul">
              <li v-for="x in product.beschreibung.ausstattung.punkte" :key="x">{{ x }}</li>
            </ul>
          </div>
          <div>
            <h3 class="label pd__desc-h">Ideal geeignet für</h3>
            <ul class="pd__desc-ul">
              <li v-for="x in product.beschreibung.idealFuer" :key="x">{{ x }}</li>
            </ul>
          </div>
        </div>
      </UiAufklapper>

      <!-- Bewertungen in der freien Flaeche neben dem Buchungskasten. -->
      <ReviewSection v-if="product.available && reviewBezug" :bezuege="[reviewBezug]" kompakt class="pd__reviews" />
    </div>
  </div>
</template>

<style scoped>
.crumbs { display: flex; flex-wrap: wrap; gap: var(--s-2); margin-bottom: var(--s-6); color: var(--c-text-muted); }
.crumbs a:hover { color: var(--c-gold); }
.crumbs__here { color: var(--c-gold); }

/* Drei Spalten wie in Louis' Mockup: Bilder, Beschreibung, Buchung. */
.pd {
  display: grid; gap: var(--s-6);
  /* minmax(0, 1fr): sonst darf breiter Inhalt die Spalte ueber den Rand druecken. */
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'gal' 'info' 'aside';
  align-items: start;
}
/* Mit Zusatzbereich (Paketvergleich bzw. Kombi-Hinweis): auf dem Handy erst
   buchen, der Vergleich steht danach. Die Vorteile zeigt schon der Kasten. */
.pd--pakete { grid-template-areas: 'gal' 'info' 'aside' 'pak' 'desc' 'rev'; }
@media (min-width: 760px) {
  .pd { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: 'gal info' 'gal aside'; }
  .pd--pakete { grid-template-areas: 'gal info' 'pak aside' 'desc desc' 'rev rev'; }
}
@media (min-width: 1200px) {
  .pd { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr) 360px; grid-template-areas: 'gal info aside'; gap: var(--s-7); }
  /* Pakete unter Galerie und Text, der Buchungskasten steht daneben. */
  .pd--pakete { grid-template-areas: 'gal info aside' 'pak pak aside' 'desc desc aside' 'rev rev aside'; grid-template-rows: auto auto auto 1fr; }
}
.pd__gallery { grid-area: gal; }
.pd__info { grid-area: info; display: grid; gap: var(--s-4); }
.pd__aside { grid-area: aside; display: grid; gap: var(--s-5); }

/* Quadratisch statt Hochformat: die Fotos sind hoch, die Seite soll es nicht sein. */
.pd__gallery :deep(.gal__stage) { aspect-ratio: 1 / 1; border-radius: var(--r-md); }
.pd__empty {
  aspect-ratio: 1 / 1; border-radius: var(--r-md);
  display: grid; place-items: center;
  background: radial-gradient(circle at 50% 45%, #F8F5F0, #E8E1D6 75%);
}
.pd__empty-funke { width: 30%; height: auto; color: var(--c-gold); opacity: 0.22; }

.pd__cat { color: var(--c-gold); }
.pd__name { font-size: var(--t-h1); }
.pd__summary { font-size: 1.0625rem; line-height: 1.65; max-width: 46ch; }

.pd__features { list-style: none; padding: 0; display: grid; gap: var(--s-3); }
.pd__features li { display: flex; align-items: center; gap: var(--s-3); }
.pd__tick {
  display: grid; place-items: center; flex: none;
  width: 1.6rem; height: 1.6rem; border-radius: 50%;
  color: var(--c-gold); border: 1px solid var(--c-gold-hair);
}

.pd__price { font-size: var(--t-h3); color: var(--c-gold); font-weight: 600; }
.pd__price .muted { font-size: var(--t-small); font-weight: 400; }
.pd__unit { display: block; }

.pd__soon {
  display: grid; gap: var(--s-3); justify-items: start;
  padding: var(--s-6) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.pd__soon-h { color: var(--c-gold); }

.pd__pakete { grid-area: pak; display: grid; gap: var(--s-4); align-content: start; }
.pd__pakete-h { font-size: var(--t-h3); }

.pd__kombi {
  display: flex; gap: var(--s-5); align-items: center;
  padding: var(--s-4);
  background: var(--c-paper-pure); border: 1px solid var(--c-gold); border-radius: var(--r-md);
  box-shadow: 0 10px 30px -18px rgb(195 139 55 / 0.55);
}
.pd__kombi-img { width: 7.5rem; height: 7.5rem; flex: none; object-fit: cover; border-radius: var(--r-sm); }
.pd__kombi-text { display: grid; gap: var(--s-2); }
.pd__kombi-text .muted { font-size: var(--t-small); }

.pd__kombi-links { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3) var(--s-5); margin-top: var(--s-1); }
.pd__kombi-link { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--c-gold); }
.pd__kombi-link:hover { color: var(--c-text); }

.pd__modell { color: var(--c-text-muted); margin-top: calc(-1 * var(--s-2)); }
.pd__desc { grid-area: desc; align-self: start; }
.pd__desc :deep(.ak__inhalt) { display: grid; gap: var(--s-4); }
.pd__desc-titel { font-size: var(--t-h3); }
.pd__desc-p { line-height: 1.7; max-width: 68ch; }
.pd__desc-lists { display: grid; gap: var(--s-5); margin-top: var(--s-2); }
@media (min-width: 560px) { .pd__desc-lists { grid-template-columns: 1fr 1fr; } }
.pd__desc-h { color: var(--c-gold); margin-bottom: var(--s-3); }
.pd__desc-ul { list-style: none; padding: 0; display: grid; gap: var(--s-2); }
.pd__desc-ul li { position: relative; padding-left: 1.1rem; line-height: 1.5; }
.pd__desc-ul li::before { content: ''; position: absolute; left: 0; top: 0.6em; width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--c-gold); }
.pd__reviews { grid-area: rev; align-self: start; padding-top: var(--s-6); border-top: var(--border-hair); }
.pd__desc + .pd__reviews { border-top: 0; padding-top: var(--s-2); }
</style>
