import { products } from '~~/shared/catalog'

// /sitemap.xml fuer die Google Search Console (Lukas, 18.11.2026): alle
// oeffentlichen Seiten. Nicht dabei: Warenkorb, Kasse, Danke-Seite,
// Verwaltung, Freigabe-Links und /links (dort noindex).
// Produkte kommen aus dem Katalog, ein neues Produkt steht also von selbst drin.
export default defineEventHandler((event) => {
  const seite = useRuntimeConfig(event).public.siteUrl
  const pfade = [
    '/', '/produkte', '/pakete', '/ueber-uns', '/kontakt',
    ...products.map(p => `/produkte/${p.slug}`),
    '/impressum', '/datenschutz', '/agb', '/widerruf',
  ]
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pfade.map(p => `  <url><loc>${seite}${p === '/' ? '/' : p}</loc></url>`).join('\n')}
</urlset>
`
})
