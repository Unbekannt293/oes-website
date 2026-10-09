<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { formatPrice } from '~~/shared/pricing'

// Querformat-Karte fuer Pakete: Foto links, Inhalt rechts. Die in Louis'
// Mockup hervorgehobenen Pakete ("Am beliebtesten") tragen die Plakette.
defineProps<{ pkg: RentalPackage }>()
</script>

<template>
  <article class="pk" :class="{ 'pk--hl': pkg.highlight }">
    <div class="pk__media">
      <NuxtImg :src="pkg.image" :alt="pkg.name" width="600" height="750" loading="lazy" class="pk__img" />
      <p v-if="pkg.highlight" class="label pk__badge">Am beliebtesten</p>
    </div>
    <div class="pk__body">
      <p class="label pk__kind">{{ pkg.kind === 'event' ? 'Event-Komplettpaket' : 'Fotobox-Paket' }}</p>
      <h3 class="display pk__name">{{ pkg.name }}</h3>
      <ul class="pk__list">
        <li v-for="item in pkg.includes" :key="item">
          <UiIcon name="check" :size="16" /> {{ item }}
        </li>
      </ul>
      <div class="pk__foot">
        <p class="pk__price">{{ formatPrice(pkg.priceCents) }}</p>
        <UiButton to="/pakete" variant="outline" size="sm">Paket ansehen</UiButton>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pk {
  display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  background: var(--c-paper-pure);
  border: var(--border-hair);
  border-radius: var(--r-md);
  overflow: hidden;
}
.pk--hl { border-color: var(--c-gold); }

.pk__media { position: relative; min-height: 100%; }
.pk__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
.pk__badge {
  position: absolute; top: var(--s-3); left: var(--s-3);
  padding: 0.35rem 0.65rem;
  color: #FFFFFF; background: var(--c-gold);
  border-radius: var(--r-sm);
}

.pk__body { display: grid; gap: var(--s-3); align-content: start; padding: var(--s-6) var(--s-5); }
.pk__kind { color: var(--c-gold); }
.pk__name { font-size: var(--t-h3); }
.pk__list { list-style: none; padding: 0; display: grid; gap: var(--s-2); font-size: var(--t-small); }
.pk__list li { display: flex; gap: var(--s-2); align-items: start; }
.pk__list svg { color: var(--c-gold); margin-top: 0.2rem; }
.pk__foot {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-3);
  margin-top: var(--s-3); padding-top: var(--s-4);
  border-top: 1px solid var(--c-gold-hair);
}
.pk__price { font-size: 1.35rem; font-weight: 600; color: var(--c-gold); }

@media (max-width: 520px) {
  .pk { grid-template-columns: 1fr; }
  .pk__media { aspect-ratio: 4 / 3; }
}
</style>
