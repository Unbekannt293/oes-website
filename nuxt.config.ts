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
      // Nuxt fuegt fuer public/favicon.ico kein <link> von selbst ein -
      // ohne diese Zeilen bleibt der Browser-Tab beim generischen
      // Standardsymbol, egal wie viele Icon-Dateien im public-Ordner liegen.
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
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

  // VORLAEUFIG: Solange nur die Linkseite fertig ist, leitet die
  // Startseite dorthin um. Bewusst 302 und nicht 301 - eine permanente
  // Umleitung wuerde sich in den Browsern der Besucher festsetzen.
  // Diesen Block loeschen, sobald die Website live gehen soll.
  routeRules: {
    '/': { redirect: { to: '/links', statusCode: 302 } },
  },

  nitro: {
    compressPublicAssets: true,
  },
})
