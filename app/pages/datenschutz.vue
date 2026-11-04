<script setup lang="ts">
import { DATENSCHUTZ } from '~~/shared/rechtstexte/datenschutz'

useSeoMeta({ title: 'Datenschutz' })
</script>

<template>
  <div>
    <PageHero
      crumb="Datenschutz"
      title="Datenschutzerklärung"
      sub="Wie wir mit Ihren Daten umgehen, wenn Sie unsere Seite nutzen, anfragen oder buchen."
    />
    <div class="section shell">
      <PdfLeser name="datenschutz" :text="DATENSCHUTZ" />
    </div>
  </div>
</template>
