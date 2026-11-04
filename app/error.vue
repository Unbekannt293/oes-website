<script setup lang="ts">
import type { NuxtError } from '#app'

// Eigene Fehlerseite statt der englischen Standardseite von Nuxt: im
// Seitenlayout mit Kopf und Fuss, damit Besucher einfach weiterklicken.
const { error } = defineProps<{ error: NuxtError }>()
const nichtGefunden = computed(() => error.statusCode === 404)

useSeoMeta({
  title: () => nichtGefunden.value ? 'Seite nicht gefunden' : 'Fehler',
  robots: 'noindex',
})

const zurueck = (ziel: string) => clearError({ redirect: ziel })
</script>

<template>
  <NuxtLayout>
    <PageHero
      :crumb="nichtGefunden ? 'Seite nicht gefunden' : 'Fehler'"
      :title="nichtGefunden ? 'Diese Seite gibt es nicht.' : 'Da ist etwas schiefgelaufen.'"
      :sub="nichtGefunden
        ? 'Vielleicht hat sich die Adresse geändert. Hier geht es weiter zu unserem Angebot.'
        : 'Bitte versuchen Sie es gleich noch einmal. Wenn es weiter hakt, rufen Sie uns gern an.'"
      layout="stack"
    />
    <section class="section">
      <div class="shell fe">
        <UiButton variant="solid" @click="zurueck('/')">Zur Startseite</UiButton>
        <UiButton variant="light" @click="zurueck('/produkte')">Produkte ansehen</UiButton>
        <UiButton variant="light" @click="zurueck('/kontakt')">Kontakt</UiButton>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.fe { display: flex; flex-wrap: wrap; gap: var(--s-3); }
</style>
