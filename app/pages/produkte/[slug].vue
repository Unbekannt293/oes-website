<script setup lang="ts">
import { categories, findProduct, fotoboxPackages } from '~~/shared/catalog'
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

const contact = useContact()

// Vorwahl aus der Adresse: ?paket=fotobox-premium oder ?sb=1 (Kombi-Karten
// der Pakete-Seite). Die Stufe laesst sich auch im Vergleich unten waehlen.
const paket = ref(typeof route.query.paket === 'string' ? route.query.paket : '')
const sb = Number(route.query.sb)
const soundboxes = ref<0 | 1 | 2>(sb === 1 || sb === 2 ? sb : 0)
const { lenis } = useLenis()

// Auswahl im Buchungskasten -> passendes Foto (product.imageFor im Katalog).
const gallery = ref<{ go: (i: number) => void } | null>(null)
function showImage(key: string) {
  const i = product.value?.imageFor?.[key]
  if (i !== undefined) gallery.value?.go(i)
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

    <div class="pd" :class="{ 'pd--pakete': product.booking === 'paket' }">
      <div class="pd__gallery">
        <ProductGallery
          v-if="product.images.length" ref="gallery" :images="product.images" :alt="product.name"
          thumbs eager :width="1254" :height="1254"
        />
        <div v-else class="pd__empty" aria-hidden="true">
          <svg viewBox="0 0 100 100"><path d="M50 0C53 35 65 47 100 50 65 53 53 65 50 100 47 65 35 53 0 50 35 47 47 35 50 0Z" /></svg>
        </div>
      </div>

      <div class="pd__info">
        <p class="label pd__cat">{{ category?.label }}</p>
        <h1 class="display pd__name">{{ product.name }}</h1>
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

        <div class="pd__ask on-ink">
          <p class="display pd__ask-h">Haben Sie Fragen?</p>
          <p class="pd__ask-sub">Wir beraten Sie gern persönlich.</p>
          <a :href="`tel:${contact.phoneRaw}`" class="pd__ask-row"><UiIcon name="phone" :size="16" /> {{ contact.phone }}</a>
          <a :href="`mailto:${contact.email}`" class="pd__ask-row"><UiIcon name="mail" :size="16" /> {{ contact.email }}</a>
          <UiButton to="/kontakt" variant="solid" size="sm" class="pd__ask-btn">Kontakt aufnehmen</UiButton>
        </div>
      </aside>

      <!-- Unter der Galerie ist Platz: dort steht der Vergleich der
           Druckstufen, ein Klick auf eine Spalte waehlt sie im Buchungskasten. -->
      <section v-if="product.booking === 'paket'" class="pd__pakete" aria-labelledby="pakete-h">
        <h2 id="pakete-h" class="display pd__pakete-h">Was ist drin?</h2>
        <PackageCompare :packages="fotoboxPackages" :selected="paket" selectable @select="choose" />
      </section>
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
/* Mit Paketen: auf dem Handy erst die Pakete ansehen, dann buchen. */
.pd--pakete { grid-template-areas: 'gal' 'info' 'pak' 'aside'; }
@media (min-width: 760px) {
  .pd { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: 'gal info' 'gal aside'; }
  .pd--pakete { grid-template-areas: 'gal info' 'pak aside'; }
}
@media (min-width: 1200px) {
  .pd { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr) 360px; grid-template-areas: 'gal info aside'; gap: var(--s-7); }
  /* Pakete unter Galerie und Text, der Buchungskasten steht daneben. */
  .pd--pakete { grid-template-areas: 'gal info aside' 'pak pak aside'; grid-template-rows: auto 1fr; }
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
.pd__empty svg { width: 30%; fill: var(--c-gold); opacity: 0.22; }

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

.pd__ask {
  display: grid; gap: var(--s-2); justify-items: start;
  padding: var(--s-6) var(--s-5);
  border-radius: var(--r-md);
}
.pd__ask-h { font-size: var(--t-h3); }
.pd__ask-sub { color: var(--c-text-muted); font-size: var(--t-small); margin-bottom: var(--s-2); }
.pd__ask-row { display: inline-flex; align-items: center; gap: var(--s-2); font-size: var(--t-small); }
.pd__ask-row svg { color: var(--c-gold); }
.pd__ask-row:hover { color: var(--c-gold); }
.pd__ask-btn { margin-top: var(--s-3); }

.pd__pakete { grid-area: pak; display: grid; gap: var(--s-4); align-content: start; }
.pd__pakete-h { font-size: var(--t-h3); }
</style>
