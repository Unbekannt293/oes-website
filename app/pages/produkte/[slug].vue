<script setup lang="ts">
import { categories, findProduct } from '~~/shared/catalog'
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

useSeoMeta({
  title: () => product.value!.name,
  description: () => product.value!.summary,
})
</script>

<template>
  <div v-if="product" class="section shell">
    <nav class="crumbs label muted" aria-label="Brotkrumen">
      <NuxtLink to="/">Startseite</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink to="/produkte">Produkte</NuxtLink>
      <span aria-hidden="true">/</span>
      <span>{{ product.name }}</span>
    </nav>

    <div class="detail">
      <NuxtImg
        :src="product.images[0]" :alt="product.name"
        width="1200" height="900" class="detail__img"
      />

      <div class="detail__info">
        <p class="label detail__cat">{{ category?.label }}</p>
        <h1 class="display detail__name">{{ product.name }}</h1>
        <p class="prose">{{ product.summary }}</p>

        <ul class="detail__features">
          <li v-for="f in product.features" :key="f">{{ f }}</li>
        </ul>

        <p class="detail__price">
          <span class="muted">ab</span> {{ formatPrice(product.priceCents) }}
          <span class="muted detail__unit">pro Veranstaltung</span>
        </p>

        <p v-if="!product.available" class="detail__soon label">
          Dieses Produkt ist bald verfügbar.
        </p>

        <div class="detail__cta">
          <UiButton to="/pakete" variant="solid">Passende Pakete ansehen</UiButton>
          <UiButton to="/kontakt" variant="ghost">Beratung anfragen</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crumbs { display: flex; gap: var(--s-2); margin-bottom: var(--s-6); }
.crumbs a:hover { color: var(--c-gold); }

.detail {
  display: grid; gap: var(--s-7);
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  align-items: start;
}
@media (max-width: 860px) { .detail { grid-template-columns: 1fr; } }

.detail__img { width: 100%; border-radius: var(--r-md); }

.detail__info { display: grid; gap: var(--s-4); }
.detail__cat { color: var(--c-gold); }
.detail__name { font-size: var(--t-h1); }

.detail__features { list-style: none; padding: 0; display: grid; gap: var(--s-2); }
.detail__features li {
  padding-left: 1.5rem; position: relative; font-size: var(--t-small);
}
.detail__features li::before {
  content: '✓'; position: absolute; left: 0; color: var(--c-gold);
}

.detail__price { font-size: var(--t-h3); color: var(--c-gold); font-weight: 600; }
.detail__price .muted { font-size: var(--t-small); font-weight: 400; }
.detail__unit { display: block; }

.detail__soon {
  color: var(--c-text-muted);
  border: 1px solid var(--c-gold-hair); border-radius: var(--r-sm);
  padding: var(--s-3) var(--s-4);
}

.detail__cta { display: flex; flex-wrap: wrap; gap: var(--s-3); margin-top: var(--s-2); }
</style>
