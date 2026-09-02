// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/image', '@nuxt/fonts', '@vueuse/nuxt'],

  // Ohne pathPrefix hiesse app/components/layout/SiteHeader.vue
  // im Template <LayoutSiteHeader>. Die Dateinamen sind schon
  // eindeutig, also weg mit dem Ordnerpraefix.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0A0A0A' },
      ],
    },
  },

  // Selbst gehostete Schriften. Kein Request an fonts.google.com,
  // damit keine IP-Adressen der Besucher in die USA gehen (DSGVO).
  fonts: {
    families: [
      { name: 'Cormorant Garamond', provider: 'google', weights: [400, 500, 600] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  runtimeConfig: {
    // Nur serverseitig lesbar. Werte kommen aus .env
    smtpHost: '',
    smtpUser: '',
    smtpPass: '',
    mailTo: '',
    routingApiKey: '',
    public: {
      siteUrl: 'https://ottos-eventservice.de',
    },
  },

  nitro: {
    compressPublicAssets: true,
  },
})
