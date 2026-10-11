<script setup lang="ts">
import type { IconName } from '~/components/ui/UiIcon.vue'
import type { RentalPackage } from '~~/shared/types'
import { cheapestWithSoundboxCents, formatPrice } from '~~/shared/pricing'

// Hochformat-Kachel fuer ein Paket, wie in Louis' Mockup: Symbol, Name,
// Inhalt, Preis, Knopf. Mit `to` fuehrt der Knopf weiter (Pakete-Seite),
// ohne `to` meldet er "select" (Auswahl auf der Produktseite).
const { pkg, to, selected = false, media = false } = defineProps<{
  pkg: RentalPackage
  to?: string
  selected?: boolean
  /** Foto oben zeigen (Event-Pakete). Fotobox-Stufen zeigen nur ein Symbol. */
  media?: boolean
}>()
const emit = defineEmits<{ select: [slug: string] }>()

const ICONS: Record<string, IconName> = {
  'fotobox': 'star', 'basic': 'gem', 'premium': 'crown', 'deluxe': 'trophy',
  'party-starter': 'star', 'event-premium': 'crown', 'rundum-sorglos': 'trophy',
}
const icon = computed(() => ICONS[pkg.tier ?? pkg.slug] ?? 'star')
const withSoundbox = computed(() => cheapestWithSoundboxCents(pkg))
</script>

<template>
  <article
    class="pt"
    :class="{ 'pt--hl': pkg.highlight && pkg.available, 'pt--sel': selected, 'pt--soon': !pkg.available }"
  >
    <p v-if="pkg.highlight && pkg.available" class="label pt__badge">Am beliebtesten</p>

    <div v-if="media" class="pt__media">
      <NuxtImg :src="pkg.image" :alt="pkg.name" width="600" height="400" loading="lazy" class="pt__img" />
      <p v-if="!pkg.available" class="label pt__soon">Coming soon</p>
    </div>

    <div class="pt__body">
      <span class="pt__icon"><UiIcon :name="icon" :size="22" /></span>
      <h3 class="display pt__name">{{ pkg.name }}</h3>
      <ul class="pt__list">
        <li v-for="item in pkg.includes" :key="item">
          <UiIcon name="check" :size="14" /> {{ item }}
        </li>
      </ul>

      <div class="pt__foot">
        <template v-if="pkg.available">
          <p class="pt__price">{{ formatPrice(pkg.priceCents) }}</p>
          <p v-if="withSoundbox" class="pt__alt">mit Soundbox ab {{ formatPrice(withSoundbox) }}</p>
          <UiButton v-if="to" :to="to" variant="solid" size="sm" class="pt__btn">Auswählen</UiButton>
          <UiButton
            v-else variant="solid" size="sm" class="pt__btn"
            :aria-pressed="selected" @click="emit('select', pkg.slug)"
          >
            <template v-if="selected"><UiIcon name="check" :size="14" /> Ausgewählt</template>
            <template v-else>Auswählen</template>
          </UiButton>
        </template>
        <template v-else>
          <p class="pt__price pt__price--soon">Preis auf Anfrage</p>
          <UiButton to="/kontakt" variant="outline" size="sm" class="pt__btn">Vormerken lassen</UiButton>
        </template>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pt {
  position: relative;
  display: flex; flex-direction: column;
  background: var(--c-paper-pure);
  border: var(--border-hair);
  border-radius: var(--r-md);
  transition: border-color var(--d-fast) var(--e-out), box-shadow var(--d-base) var(--e-out);
}
.pt--hl { border-color: var(--c-gold); }
.pt--sel { border-color: var(--c-gold); box-shadow: 0 0 0 2px var(--c-gold), var(--shadow-card); }

.pt__badge {
  position: absolute; top: 0; left: 50%; z-index: 2;
  transform: translate(-50%, -50%);
  padding: 0.35rem 0.75rem; white-space: nowrap;
  color: #FFFFFF; background: var(--c-gold);
  border-radius: var(--r-sm);
}

.pt__media { position: relative; aspect-ratio: 3 / 2; overflow: hidden; border-radius: var(--r-md) var(--r-md) 0 0; }
.pt__img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 35%; }
.pt--soon .pt__img { filter: grayscale(0.7); opacity: 0.85; }
.pt__soon {
  position: absolute; inset-inline: -10%; top: 50%;
  padding-block: 0.6rem; text-align: center;
  font-size: 0.7rem; letter-spacing: 0.3em; color: #6B6660;
  background: rgb(255 255 255 / 0.78); backdrop-filter: blur(4px);
  border-block: 1px solid var(--c-gold-hair);
  transform: translateY(-50%) rotate(-6deg);
}

.pt__body {
  flex: 1;
  display: grid; grid-template-rows: auto auto 1fr auto; gap: var(--s-3);
  justify-items: center; text-align: center;
  padding: var(--s-6) var(--s-5) var(--s-5);
}
.pt__icon {
  display: grid; place-items: center;
  width: 3rem; height: 3rem; border-radius: 50%;
  color: var(--c-gold); border: 1px solid var(--c-gold-hair);
}
.pt__name { font-size: var(--t-h3); }
.pt__list { list-style: none; padding: 0; display: grid; gap: 0.35rem; align-content: start; font-size: var(--t-small); text-align: left; }
.pt__list li { display: flex; gap: 0.45rem; align-items: start; }
.pt__list svg { color: var(--c-gold); margin-top: 0.25rem; }

.pt__foot {
  display: grid; justify-items: center; gap: 0.2rem;
  width: 100%; padding-top: var(--s-4);
  border-top: 1px solid var(--c-gold-hair);
}
.pt__price { font-size: 1.4rem; font-weight: 600; color: var(--c-text); }
.pt__price--soon { font-size: 1rem; color: var(--c-text-muted); font-weight: 500; }
.pt__alt { font-size: 0.8125rem; color: var(--c-text-muted); }
.pt__btn { width: 100%; margin-top: var(--s-3); }
</style>
