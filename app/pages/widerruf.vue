<script setup lang="ts">
import { WIDERRUF } from '~~/shared/rechtstexte/widerruf'

useSeoMeta({ title: 'Widerrufsbelehrung' })
</script>

<template>
  <div>
    <PageHero
      crumb="Widerrufsbelehrung"
      title="Widerrufsbelehrung"
      sub="Ihre Rechte als Verbraucher und wie Sie einen Vertrag widerrufen können."
    />
    <div class="section shell">
      <PdfLeser name="widerruf" :text="WIDERRUF" />
    </div>
  </div>
</template>
