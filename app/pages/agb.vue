<script setup lang="ts">
import { AGB } from '~~/shared/rechtstexte/agb'

useSeoMeta({ title: 'AGB' })
</script>

<template>
  <div>
    <PageHero
      crumb="AGB"
      title="Allgemeine Mietbedingungen"
      sub="Die Bedingungen für Miete, Lieferung und Rückgabe unserer Eventausstattung."
    />
    <div class="section shell">
      <PdfLeser name="agb" :text="AGB" />
    </div>
  </div>
</template>
