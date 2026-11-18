<script setup lang="ts">
useSeoMeta({
  titleTemplate: (t?: string | null) => (t ? `${t} | OES` : "OES - Otto's Event Service"),
  description:
    'Zelte, Fotoboxen, Musik- und Lichttechnik mieten in Hamburg. '
    + 'Alles aus einer Hand, inklusive Auf- und Abbau.',
  ogType: 'website',
  ogLocale: 'de_DE',
})

// Firmendaten fuer Suchmaschinen (schema.org, unsichtbar). Verknuepft die
// Seite mit dem Google-Unternehmensprofil, Instagram und TikTok, damit
// Google sie als dasselbe Unternehmen erkennt (Lukas, 18.11.2026). Keine
// Strasse: das Google-Profil zeigt bewusst nur das Einsatzgebiet. Keine
// Bewertungen: eigene Bewertungen auf der eigenen Seite wertet Google nicht.
const contact = useContact()
const seite = useRuntimeConfig().public.siteUrl
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${seite}/#unternehmen`,
      'name': "Otto's Event Service",
      'alternateName': 'OES',
      'description': 'Fotobox und Soundbox mieten in Hamburg, mit Lieferung, Auf- und Abbau.',
      'url': seite,
      'logo': `${seite}/images/oes-logo-hell.png`,
      'image': `${seite}/images/oes-logo-hell.png`,
      'telephone': contact.phoneRaw,
      'email': contact.email,
      'address': { '@type': 'PostalAddress', 'addressLocality': 'Hamburg', 'postalCode': '22047', 'addressCountry': 'DE' },
      'areaServed': { '@type': 'City', 'name': 'Hamburg' },
      'priceRange': '€€',
      'sameAs': [contact.social.google, contact.social.instagram, contact.social.tiktok],
    }),
  }],
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
