<script setup lang="ts">
import { products } from '~~/shared/catalog'

useSeoMeta({
  title: 'Eventausstattung mieten in Hamburg',
  description:
    'Zelte, Fotoboxen, Ton- und Lichttechnik für Hochzeiten, Geburtstage '
    + 'und Firmenfeiern. Auf- und Abbau inklusive.',
})

// Auf der Startseite genau eine Reihe, damit die Vorschau als ganzer
// Bildschirm einrastet. Der Rest lebt unter /produkte.
const featured = computed(() => products.filter(p => p.available).slice(0, 4))

const gridEl = ref<HTMLElement | null>(null)
useReveal(gridEl)

// Vom Hero mit einer Geste sauber zur Produktvorschau (Mausrad, Pfeil).
const angebot = ref<HTMLElement | null>(null)
const { goNext } = useSectionSnap(angebot)

// Fuer Touch-Geraete: CSS-Snap nur auf der Startseite (siehe Stil unten).
useHead({ htmlAttrs: { class: 'snap-home' } })
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
              Events<br><em>beleben.</em>
            </h1>
            <p class="hero__lead muted">
              Zelte, Fotoboxen, Musik und mehr. Alles aus einer Hand
              für unvergessliche Veranstaltungen.
            </p>
          </div>

          <!-- Ohne Header sind das die Wege von der Startseite weg. -->
          <div class="hero__cta">
            <UiButton to="/pakete" variant="solid" size="xl" class="hero__btn hero__btn--main">
              Pakete ansehen <span aria-hidden="true">&rarr;</span>
            </UiButton>
            <UiButton to="/kontakt" variant="outline" size="xl" class="hero__btn">
              Beratung anfragen
            </UiButton>
          </div>
        </div>

        <a href="#angebot" class="hero__scroll" @click.prevent="goNext">
          <span class="visually-hidden">Weiter zum Angebot</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"
               stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>

        <p class="label hero__hint" aria-hidden="true">
          <span class="hero__hint--pointer">Klicken zum Auslösen</span>
          <span class="hero__hint--touch">Tippen zum Auslösen</span>
        </p>
      </div>
    </FotoboxHero>

    <!-- ============ Produkte ============ -->
    <section id="angebot" ref="angebot" class="section angebot">
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
/* Kasten ~57 % der Hoehe; das LED-Licht sitzt darueber und braucht oben Platz. */
.hero { --fb-x: 0.5; --fb-y: 0.52; --fb-h: 1.1; }

.hero__stage {
  position: relative;
  min-height: max(640px, calc(100svh - var(--hdr-h)));
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

.hero__title { font-size: clamp(3rem, 1.6rem + 4.2vw, 5.4rem); line-height: 0.95; }
.hero__title em { font-style: normal; color: var(--c-gold); }

.hero__lead { margin-top: var(--s-4); max-width: 34ch; }

.hero__cta { display: flex; flex-wrap: wrap; gap: var(--s-3); }
.hero__btn { gap: var(--s-3); }
/* Hauptweg: warmer Schein, damit er vor der dunklen Buehne als Erstes ins Auge faellt */
.hero__btn--main { box-shadow: 0 10px 40px -10px rgb(195 139 55 / 0.65); }
.hero__btn--main span { transition: transform var(--d-fast) var(--e-out); }
.hero__btn--main:hover span { transform: translateX(4px); }

/* Scroll-Hinweis: dunkler Kreis, damit er auch ueber dem weissen Stoff lesbar ist */
.hero__scroll {
  position: absolute; left: 50%; bottom: var(--s-5);
  translate: -50% 0;
  display: grid; place-items: center;
  width: 48px; height: 48px; border-radius: 50%;
  color: var(--c-gold);
  background: rgb(11 10 9 / 0.65);
  border: 1px solid rgb(195 139 55 / 0.45);
  backdrop-filter: blur(6px);
  animation: hint-bob 2.2s var(--e-out) infinite;
  transition: background var(--d-fast) var(--e-out), color var(--d-fast) var(--e-out);
}
.hero__scroll:hover { background: var(--c-gold); color: #fff; }
@keyframes hint-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
@media (prefers-reduced-motion: reduce) { .hero__scroll { animation: none; } }

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
  /* Der Textblock unten ist mit Slogan und zwei grossen Buttons ~ halb so hoch
     wie der Schirm. Die Box (LED-Oberkante bis Kastenunterkante = 66 % der
     Bildhoehe) muss darueber passen, sonst liegt weisse Schrift auf der weissen Front. */
  .hero { --fb-y: 0.3; --fb-h: 0.64; }
  .hero__veil {
    background: linear-gradient(0deg,
      rgb(11 10 9 / 0.95) 0%, rgb(11 10 9 / 0.75) 32%, transparent 55%);
  }
  .hero__inner { padding-block: var(--s-6) calc(var(--s-6) + 56px); }
  .hero__cta { width: 100%; }
  .hero__btn { flex: 1 1 100%; }
}

/* ---- Produktvorschau: ein ganzer Bildschirm, auf den der Hero einrastet ---- */
.angebot {
  min-height: calc(100svh - var(--hdr-h));
  display: grid;
  align-content: center;
  padding-block: var(--s-7);
}

/* ---- Produktraster ---- */
.grid {
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.more { display: flex; justify-content: center; margin-top: var(--s-7); }
</style>

<style>
/* Hoehe des klebenden Headers, fuer Hero, Vorschau und Snap-Abstaende. */
:root { --hdr-h: 78px; }

/* Touch scrollt nativ (Lenis greift dort nicht), also hier CSS-Snap.
   proximity statt mandatory: unterhalb der Vorschau bis in den Footer
   soll man frei scrollen koennen. */
@media (hover: none) and (pointer: coarse) {
  html.snap-home { scroll-snap-type: y proximity; }
  html.snap-home .hero,
  html.snap-home #angebot { scroll-snap-align: start; scroll-margin-top: var(--hdr-h); }
}
</style>
