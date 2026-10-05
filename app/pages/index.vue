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
    <FotoboxHero class="hero" alt="Fotobox von Otto's Event Service auf Stativ">
      <div class="hero__stage">
        <div class="hero__veil" aria-hidden="true" />

        <div class="shell hero__inner">
          <h1 class="display hero__title">
            Ihr Event.<br>Unser <em>Service.</em>
          </h1>
          <p class="hero__lead muted">
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

        <p class="label hero__hint" aria-hidden="true">
          <span class="hero__hint--pointer">Klicken zum Auslösen</span>
          <span class="hero__hint--touch">Tippen zum Auslösen</span>
        </p>
      </div>
    </FotoboxHero>

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
/* Hell wie bei Lando: das Foto steht auf Papierton. Die Box sitzt rechts
   der Mitte, links ist Platz fuer die Headline. */
.hero { --fb-x: 0.64; --fb-h: 0.96; }

.hero__stage {
  position: relative;
  min-height: max(620px, calc(100svh - 72px));
  display: grid;
  align-items: center;
}

/* Hinter der Schrift leicht aufhellen, damit sie ueber Hoehenlinien
   und Blitzspur lesbar bleibt. */
.hero__veil {
  position: absolute; inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg,
    rgb(245 243 241 / 0.85) 0%, rgb(245 243 241 / 0.5) 30%, transparent 52%);
}

.hero__inner { position: relative; padding-block: var(--s-8); }

.hero__title { font-size: var(--t-hero); max-width: 14ch; }
.hero__title em { font-style: normal; color: var(--c-gold); }

.hero__lead { margin-top: var(--s-5); max-width: 36ch; font-size: 1.0625rem; }

.hero__cta { display: flex; flex-wrap: wrap; gap: var(--s-3); margin-top: var(--s-6); }

.hero__trust {
  list-style: none; padding: 0; margin-top: var(--s-8);
  display: flex; flex-wrap: wrap; gap: var(--s-7);
  border-top: 1px solid var(--c-gold-hair); padding-top: var(--s-5);
  max-width: 32rem;
}
.hero__trust li { display: grid; gap: 2px; font-size: var(--t-small); }
.hero__trust-t { color: var(--c-gold); }

.hero__hint {
  position: absolute; top: var(--s-5); right: var(--gutter);
  color: var(--c-gold); font-size: 0.625rem;
  pointer-events: none;
}
.hero__hint--touch { display: none; }
@media (hover: none) {
  .hero__hint--pointer { display: none; }
  .hero__hint--touch { display: inline; }
}

@media (max-width: 720px) {
  .hero { --fb-x: 0.5; --fb-h: 0.8; }
  .hero__stage { align-items: end; }
  .hero__veil {
    background: linear-gradient(0deg,
      rgb(245 243 241 / 0.95) 0%, rgb(245 243 241 / 0.75) 30%, transparent 52%);
  }
  .hero__inner { padding-block: var(--s-6); }
  .hero__trust { display: none; }
}

/* ---- Produktraster ---- */
.grid {
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.more { display: flex; justify-content: center; margin-top: var(--s-7); }
</style>
