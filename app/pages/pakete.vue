<script setup lang="ts">
import type { RentalPackage } from '~~/shared/types'
import { fotoboxPackages, kombis } from '~~/shared/catalog'

useSeoMeta({
  title: 'Pakete',
  description:
    'Fotobox allein oder zusammen mit einer oder zwei Soundboxen, '
    + 'von digital bis 700 Ausdrucke. Für Ihr Event in Hamburg.',
})

// Ein Klick auf eine Stufe fuehrt in die Fotobox-Buchung, Stufe vorgewaehlt.
const toBooking = (p: RentalPackage) => `/produkte/fotobox?paket=${p.slug}#buchen`
</script>

<template>
  <div>
    <PageHero
      crumb="Pakete"
      title="Pakete für Ihr Event."
      sub="Fotobox allein oder zusammen mit Soundbox. Wie viele Ausdrucke es sein sollen, wählen Sie bei der Buchung."
      image="/images/pakete/banner.webp" image-mobile="/images/pakete/banner-mobil.webp"
      tone="plain" layout="stack" focus="100% 40%"
    />

    <!-- Dieselben Karten wie auf der Produktseite. Jede fuehrt zur Fotobox-
         Buchung, die Soundbox-Zahl ist dort schon gewaehlt. -->
    <section class="section" aria-labelledby="kombi-h">
      <div class="shell">
        <h2 id="kombi-h" class="display h-col pk-h">Event-Komplettpakete</h2>
        <div class="grid">
          <ProductCard v-for="k in kombis" :key="k.slug" :product="k" :to="k.to" />
        </div>
      </div>
    </section>

    <section class="section pk-sec" aria-labelledby="cmp-h">
      <div class="shell">
        <h2 id="cmp-h" class="display h-col pk-h">Fotobox-Pakete</h2>
        <PackageCompare :packages="fotoboxPackages" :to="toBooking" />
      </div>
    </section>

    <section class="section pk-sec">
      <div class="shell ask">
        <div>
          <h2 class="display ask__h">Noch unsicher?</h2>
          <p class="muted">Schreiben Sie uns, wir finden das passende Paket für Ihre Feier.</p>
        </div>
        <UiButton to="/kontakt" variant="solid">
          Kontakt aufnehmen <UiIcon name="arrow" :size="14" />
        </UiButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pk-h { margin-bottom: var(--s-7); }

/* Folgeabschnitte nur durch eine Haarlinie getrennt. */
.pk-sec { padding-top: 0; }
.pk-sec .shell { border-top: 1px solid var(--c-gold-hair); padding-top: var(--section-y); }

.grid {
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-auto-rows: 1fr;
}
@media (min-width: 900px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.ask { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-5); }
.ask__h { font-size: var(--t-h3); margin-bottom: var(--s-2); }
</style>
