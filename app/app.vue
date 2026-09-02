<script setup lang="ts">
useSeoMeta({
  titleTemplate: (t?: string | null) => (t ? `${t} | OES` : "OES - Otto's Event Service"),
  description:
    'Zelte, Fotoboxen, Musik- und Lichttechnik mieten in Hamburg. '
    + 'Alles aus einer Hand, inklusive Auf- und Abbau.',
  ogType: 'website',
  ogLocale: 'de_DE',
})

// Sanftes Scrollen im Stil der Referenzseite. Nur im Browser,
// und nur wenn der Nutzer keine reduzierte Bewegung eingestellt hat.
useLenisScroll()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
