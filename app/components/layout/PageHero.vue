<script setup lang="ts">
// Kopf jeder Unterseite: echtes Eventfoto, warm entsaettigt, darueber
// linksbuendig am Inhaltsraster Brotkrumen, eine Aussage als Titel und
// die Unterzeile daneben.
//
// Jede Seite kann ihr eigenes Motiv mitgeben (Zelt fuer Zelte, Fotobox
// fuer Fotoboxen). Bis Louis eigene Eventfotos hat, steht das Konzertfoto.
const {
  crumb, title, sub, image = '/images/hero/party-konzert.webp', imageMobile,
  focus = '50% 45%', tone = 'warm', layout = 'split',
} = defineProps<{
  /** Seitenname fuer die Brotkrumen, z. B. "Kontakt". */
  crumb: string
  title: string
  sub?: string
  image?: string
  /** Eigener Ausschnitt fuer schmale Bildschirme, wenn der breite dort schlecht passt. */
  imageMobile?: string
  /** Bildausschnitt wie object-position, falls das Motiv nicht mittig sitzt. */
  focus?: string
  /**
   * warm: bunte Eventfotos stark abgedunkelt und warm getoent.
   * mono: Bilder, die schon schwarzweiss und dunkel sind (Produktbanner),
   * nur leicht abgedunkelt, damit das klare Schwarzweiss bleibt.
   * plain: Bild ist schon fertig gestaltet (Buehne, Farbe), nichts darueberlegen
   * ausser einem schwachen Verlauf hinter dem Text.
   */
  tone?: 'warm' | 'mono' | 'plain'
  /**
   * split: Titel links, Unterzeile rechts daneben.
   * stack: Unterzeile unter dem Titel. Gebraucht, wenn rechts ein Motiv steht.
   */
  layout?: 'split' | 'stack'
}>()
</script>

<template>
  <header class="ph on-ink" :class="[`ph--${tone}`, `ph--${layout}`, { 'ph--has-mobile': imageMobile }]">
    <picture>
      <source v-if="imageMobile" media="(max-width: 640px)" :srcset="imageMobile">
      <img
        :src="image" alt="" class="ph__img" :style="{ objectPosition: focus }"
        fetchpriority="high" decoding="async"
      >
    </picture>
    <div class="shell ph__inner">
      <nav class="ph__crumbs" aria-label="Brotkrumen">
        <NuxtLink to="/">Startseite</NuxtLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page" class="ph__here">{{ crumb }}</span>
      </nav>
      <div class="ph__grid">
        <h1 class="display ph__title" :class="{ 'ph__title--wide': !sub }">{{ title }}</h1>
        <p v-if="sub" class="ph__sub">{{ sub }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.ph {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: #0B0A09;
}

.ph__img {
  position: absolute; inset: 0; z-index: -2;
  width: 100%; height: 100%; object-fit: cover;
  /* Bunte Buehnenfarben auf die Hauspalette ziehen: schwarzweiss, dann
     leicht warm getoent. So passt jedes Foto zu Gold und Schwarz. */
  filter: grayscale(1) sepia(0.35) brightness(0.62) contrast(1.08);
}
/* Links dunkel fuer den Titel, nach rechts frei fuers Motiv, unten dunkel
   fuer den Uebergang. */
.ph::before {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background:
    linear-gradient(90deg, rgb(11 10 9 / 0.92) 0%, rgb(11 10 9 / 0.55) 50%, rgb(11 10 9 / 0.15) 100%),
    linear-gradient(0deg, rgb(11 10 9 / 0.7), transparent 55%);
}
.ph--plain .ph__img { filter: none; }
.ph--plain::before {
  background:
    linear-gradient(90deg, rgb(11 10 9 / 0.4) 0%, rgb(11 10 9 / 0.12) 50%, transparent 75%),
    linear-gradient(0deg, rgb(11 10 9 / 0.35), transparent 30%);
}
/* Eigenes Handybild: Motiv oben, Text darunter. Damit sie sich nicht
   ueberdecken, bekommt der Kopf auf schmalen Bildschirmen mehr Hoehe. */
@media (max-width: 640px) {
  .ph--has-mobile .ph__inner { min-height: clamp(440px, 140vw, 620px); }
  /* Der Ausschnitt fuer Desktop (focus) gilt hier nicht, das Handybild ist mittig gebaut. */
  .ph--has-mobile .ph__img { object-position: 50% 0 !important; }
}
.ph--stack .ph__grid { grid-template-columns: minmax(0, 1fr); }
.ph--stack .ph__sub { padding: 0; border: 0; }
.ph--mono .ph__img { filter: grayscale(1) contrast(1.05) brightness(0.9); }
.ph--mono::before {
  background:
    linear-gradient(90deg, rgb(11 10 9 / 0.7) 0%, rgb(11 10 9 / 0.3) 45%, rgb(11 10 9 / 0.2) 100%),
    linear-gradient(0deg, rgb(11 10 9 / 0.45), transparent 35%);
}
/* Goldene Haarlinie als Kante zum hellen Inhalt, nach rechts auslaufend. */
.ph::after {
  content: '';
  position: absolute; inset-inline: 0; bottom: 0; height: 1px;
  background: linear-gradient(90deg, var(--c-gold), transparent 70%);
  opacity: 0.6;
}

.ph__inner {
  min-height: clamp(340px, 46vh, 480px);
  display: grid; align-content: end;
  padding-block: clamp(2.5rem, 1.5rem + 4vw, 4.5rem) clamp(2.5rem, 1.5rem + 3.5vw, 4rem);
}

.ph__crumbs {
  display: flex; flex-wrap: wrap; gap: var(--s-2);
  margin-bottom: clamp(1.5rem, 1rem + 2vw, 2.75rem);
  font-size: var(--t-label); font-weight: 600;
  letter-spacing: var(--tr-label); text-transform: uppercase;
  color: var(--c-text-muted);
}
.ph__crumbs a { transition: color var(--d-fast) var(--e-out); }
.ph__crumbs a:hover { color: var(--c-gold); }
.ph__here { color: var(--c-gold); }

.ph__grid { display: grid; gap: var(--s-5); align-items: end; }
@media (min-width: 900px) {
  .ph__grid { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: var(--s-8); }
}

.ph__title {
  font-size: clamp(2.4rem, 1.3rem + 3.8vw, 4.5rem);
  line-height: 1.02;
  max-width: 15ch;
}
/* Ohne Unterzeile ist rechts Platz, der Titel darf breiter laufen. */
.ph__title--wide { max-width: 20ch; }
.ph__sub {
  max-width: 40ch;
  color: var(--c-text-muted);
  font-size: clamp(1.02rem, 0.96rem + 0.3vw, 1.15rem);
  line-height: 1.6;
}
@media (min-width: 900px) {
  .ph__sub { padding-left: var(--s-6); border-left: 1px solid var(--c-gold-hair); padding-bottom: 0.35rem; }
}
</style>
