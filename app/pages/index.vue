<script setup lang="ts">
import { products } from '~~/shared/catalog'

useSeoMeta({
  title: 'Eventausstattung mieten in Hamburg',
  description:
    'Zelte, Fotoboxen, Ton- und Lichttechnik für Hochzeiten, Geburtstage '
    + 'und Firmenfeiern. Auf- und Abbau inklusive.',
})

// Auf der Startseite nur eine Auswahl. Der Rest lebt unter /produkte.
const featured = computed(() => products.filter(p => p.available).slice(0, 6))

const gridEl = ref<HTMLElement | null>(null)
useReveal(gridEl)
</script>

<template>
  <div>
    <!-- ============ Hero ============ -->
    <FotoboxHero class="hero on-ink" alt="Fotobox von Otto's Event Service auf Stativ">
      <div class="hero__stage">
        <div class="hero__veil" aria-hidden="true" />

        <div class="shell hero__inner">
          <div class="hero__text">
            <h1 class="display hero__title">
              Ihr Event.<br>Unser <em>Service.</em>
            </h1>
            <p class="hero__lead muted">
              Zelte, Fotoboxen, Musik und mehr. Alles aus einer Hand
              für unvergessliche Veranstaltungen.
            </p>
          </div>

          <div class="hero__cta">
            <UiButton to="/pakete" variant="solid" size="lg">Pakete ansehen</UiButton>
            <UiButton to="/kontakt" variant="outline" size="lg">Beratung anfragen</UiButton>
          </div>
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
/* Dunkle Buehne wie bei Lando, damit der Blitz knallt. Die Box steht gross
   in der Mitte (Kasten = ~66 % der Hoehe), das Stativ laeuft unten raus.
   Die Schrift sitzt unten links, ausserhalb der Box. */
.hero { --fb-x: 0.5; --fb-y: 0.47; --fb-h: 1.25; }

.hero__stage {
  position: relative;
  min-height: max(640px, calc(100svh - 72px));
  display: grid;
  align-items: end;
}

/* Nur unten links abdunkeln, wo die Schrift steht. */
.hero__veil {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 60% 55% at 0% 100%,
    rgb(11 10 9 / 0.85) 0%, rgb(11 10 9 / 0.4) 55%, transparent 100%);
}

.hero__inner {
  position: relative;
  padding-block: var(--s-7);
  display: flex; flex-wrap: wrap; align-items: end;
  justify-content: space-between; gap: var(--s-6);
}
.hero__text { max-width: 30rem; }

.hero__title { font-size: clamp(2.2rem, 1.3rem + 2.6vw, 3.6rem); }
.hero__title em { font-style: normal; color: var(--c-gold); }

.hero__lead { margin-top: var(--s-4); max-width: 34ch; }

.hero__cta { display: flex; flex-wrap: wrap; gap: var(--s-3); }

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
  /* Kleiner und hoeher, damit unten Platz fuer Text und Buttons bleibt. */
  .hero { --fb-y: 0.31; --fb-h: 0.8; }
  .hero__veil {
    background: linear-gradient(0deg,
      rgb(11 10 9 / 0.95) 0%, rgb(11 10 9 / 0.75) 32%, transparent 55%);
  }
  .hero__inner { padding-block: var(--s-6); }
}

/* ---- Produktraster ---- */
.grid {
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.more { display: flex; justify-content: center; margin-top: var(--s-7); }
</style>
