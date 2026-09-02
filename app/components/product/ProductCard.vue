<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { formatPrice } from '~~/shared/pricing'

defineProps<{ product: Product }>()
</script>

<template>
  <article class="card" :class="{ 'card--soon': !product.available }">
    <NuxtLink :to="`/produkte/${product.slug}`" class="card__link">
      <div class="card__media">
        <NuxtImg
          :src="product.images[0]" :alt="product.name"
          width="800" height="600" loading="lazy" class="card__img"
        />
        <p v-if="!product.available" class="card__soon label">Bald verfügbar</p>
      </div>

      <div class="card__body">
        <h3 class="card__name">{{ product.name }}</h3>
        <p class="card__summary muted">{{ product.summary }}</p>
        <p class="card__price">
          <span class="muted">ab</span> {{ formatPrice(product.priceCents) }}
        </p>
      </div>
    </NuxtLink>
  </article>
</template>

<style scoped>
.card {
  background: var(--c-paper-pure);
  border: var(--border-hair);
  border-radius: var(--r-md);
  overflow: hidden;
  transition: transform var(--d-base) var(--e-out),
              box-shadow var(--d-base) var(--e-out);
}
.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-card); }

.card__media { position: relative; aspect-ratio: 4 / 3; overflow: hidden; }
.card__img { width: 100%; height: 100%; object-fit: cover;
  transition: transform var(--d-slow) var(--e-out); }
.card:hover .card__img { transform: scale(1.04); }

/* "bald verfügbar" quer ueber das Bild, wie von Louis notiert. */
.card__soon {
  position: absolute; inset: 0;
  display: grid; place-content: center;
  background: rgb(10 10 10 / 0.55);
  color: #D8D3CB; font-size: 0.8rem; letter-spacing: 0.2em;
  transform: rotate(-8deg) scale(1.2);
}
.card--soon { opacity: 0.85; }

.card__body { display: grid; gap: var(--s-2); padding: var(--s-4) var(--s-5) var(--s-5); }
.card__name { font-size: var(--t-h3); font-weight: 500; }
.card__summary { font-size: var(--t-small); }
.card__price { color: var(--c-gold); font-weight: 600; margin-top: var(--s-1); }
.card__price .muted { font-weight: 400; font-size: var(--t-small); }
</style>
