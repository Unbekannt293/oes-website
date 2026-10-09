<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { formatPrice } from '~~/shared/pricing'

defineProps<{ product: Product }>()
</script>

<template>
  <article class="card" :class="{ 'card--soon': !product.available }">
    <NuxtLink :to="`/produkte/${product.slug}`" class="card__link">
      <div class="card__media" :class="{ 'card__media--empty': !product.images[0] }">
        <NuxtImg
          v-if="product.images[0]"
          :src="product.images[0]" :alt="product.name"
          width="600" height="750" loading="lazy" class="card__img"
        />
        <!-- Noch kein Foto: Stern aus dem OES-Logo als ruhige Kachel. -->
        <svg v-else class="card__star" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 0C53 35 65 47 100 50 65 53 53 65 50 100 47 65 35 53 0 50 35 47 47 35 50 0Z" />
        </svg>
        <p v-if="!product.available" class="card__soon label">Coming soon</p>
      </div>

      <div class="card__body">
        <h3 class="card__name">{{ product.name }}</h3>
        <p class="card__summary muted">{{ product.summary }}</p>
        <!-- Kein Preis fuer etwas, das man noch nicht mieten kann. -->
        <p v-if="product.available" class="card__price">
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

.card__media { position: relative; aspect-ratio: 4 / 5; overflow: hidden; background: #ECE8E2; }
/* Ausschnitt nach oben: oben sitzen Licht und Kanten der Produkte, unten
   nur Stativ und Stoff. */
.card__img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%;
  transition: transform var(--d-slow) var(--e-out); }
.card:hover .card__img { transform: scale(1.04); }

.card__media--empty {
  display: grid; place-items: center;
  background: radial-gradient(circle at 50% 45%, #F8F5F0, #E8E1D6 75%);
}
.card__star { width: 34%; fill: var(--c-gold); opacity: 0.22; }

/* "Coming soon" quer ueber das Bild, wie von Louis notiert ("graue
   Schrift quer drüber"): ein schmales Band statt einer Abdunklung. */
.card__soon {
  position: absolute; inset-inline: -10%; top: 50%;
  padding-block: 0.7rem;
  text-align: center;
  font-size: 0.75rem; letter-spacing: 0.32em;
  color: #6B6660;
  background: rgb(255 255 255 / 0.72);
  backdrop-filter: blur(4px);
  border-block: 1px solid var(--c-gold-hair);
  transform: translateY(-50%) rotate(-8deg);
}
/* Mit Foto: Bild leicht entsaettigt, damit klar ist, dass es noch nicht geht. */
.card--soon .card__img { filter: grayscale(0.6); opacity: 0.85; }

.card__body { display: grid; gap: var(--s-2); padding: var(--s-4) var(--s-5) var(--s-5); }
.card__name { font-size: var(--t-h3); font-weight: 500; }
.card__summary { font-size: var(--t-small); }
.card__price { color: var(--c-gold); font-weight: 600; margin-top: var(--s-1); }
.card__price .muted { font-weight: 400; font-size: var(--t-small); }
</style>
