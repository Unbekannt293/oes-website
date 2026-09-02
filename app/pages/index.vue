<script setup lang="ts">
import { products } from '~~/shared/catalog'

useSeoMeta({
  title: 'Eventausstattung mieten in Hamburg',
  description:
    'Zelte, Fotoboxen, Ton- und Lichttechnik für Hochzeiten, Geburtstage '
    + 'und Firmenfeiern. Auf- und Abbau inklusive.',
})

const trust = [
  { title: 'Top Qualität',   text: 'Modern & zuverlässig' },
  { title: 'Alles aus',       text: 'einer Hand' },
  { title: 'Persönlich',     text: '& zuverlässig' },
]

// Auf der Startseite nur eine Auswahl. Der Rest lebt unter /produkte.
const featured = computed(() => products.filter(p => p.available).slice(0, 6))

const gridEl = ref<HTMLElement | null>(null)
useReveal(gridEl)
</script>

<template>
  <div>
    <!-- ============ Hero ============ -->
    <section class="hero on-ink">
      <NuxtImg
        src="/images/platzhalter.svg" alt="" aria-hidden="true"
        class="hero__bg" width="1920" height="1080" preload
      />
      <div class="hero__veil" aria-hidden="true" />

      <div class="shell hero__inner">
        <h1 class="display hero__title">
          Ihr Event.<br>Unser <em>Service.</em>
        </h1>
        <p class="hero__lead">
          Zelte, Fotoboxen, Musik und mehr. Alles aus einer Hand
          für unvergessliche Veranstaltungen.
        </p>

        <div class="hero__cta">
          <UiButton to="/pakete" variant="solid" size="lg">Pakete ansehen</UiButton>
          <UiButton to="/kontakt" variant="outline" size="lg">Beratung anfragen</UiButton>
        </div>

        <ul class="hero__trust">
          <li v-for="t in trust" :key="t.title">
            <span class="label hero__trust-t">{{ t.title }}</span>
            <span class="muted">{{ t.text }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- ============ Produkte ============ -->
    <section class="section">
      <div class="shell">
        <SectionHeading
          title="Unsere Produkte"
          sub="Wählen Sie aus unseren beliebtesten Produkten für Ihr Event."
        />
        <div ref="gridEl" class="grid reveal">
          <ProductCard v-for="p in featured" :key="p.slug" :product="p" />
        </div>
        <p class="more">
          <UiButton to="/produkte" variant="ghost">Alle Produkte ansehen</UiButton>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---- Hero ---- */
.hero { position: relative; min-height: min(88dvh, 820px); display: grid; align-items: end; }
.hero__bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
}
/* Verlauf nach links, damit die Schrift auf jedem Foto lesbar bleibt. */
.hero__veil {
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgb(10 10 10 / 0.92) 0%, rgb(10 10 10 / 0.55) 45%, rgb(10 10 10 / 0.15) 100%),
    linear-gradient(0deg, rgb(10 10 10 / 0.85) 0%, transparent 55%);
}
.hero__inner { position: relative; padding-block: var(--s-9) var(--s-8); }

.hero__title { font-size: var(--t-hero); max-width: 14ch; }
.hero__title em { font-style: normal; color: var(--c-gold); }

.hero__lead { margin-top: var(--s-5); max-width: 44ch; font-size: 1.0625rem; }

.hero__cta { display: flex; flex-wrap: wrap; gap: var(--s-3); margin-top: var(--s-6); }

.hero__trust {
  list-style: none; padding: 0; margin-top: var(--s-8);
  display: flex; flex-wrap: wrap; gap: var(--s-7);
  border-top: 1px solid var(--c-gold-hair); padding-top: var(--s-5);
}
.hero__trust li { display: grid; gap: 2px; font-size: var(--t-small); }
.hero__trust-t { color: var(--c-gold); }

/* ---- Produktraster ---- */
.grid {
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.more { display: flex; justify-content: center; margin-top: var(--s-7); }
</style>
