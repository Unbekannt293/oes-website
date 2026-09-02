<script setup lang="ts">
// Kontaktdaten zentral, damit sie nicht auf fuenf Seiten auseinanderlaufen.
const contact = useContact()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="ftr on-ink">
    <div class="shell ftr__grid">
      <div>
        <p class="brand__mark display">OES</p>
        <p class="muted ftr__claim">
          Zelte, Fotoboxen, Musik und mehr. Alles aus einer Hand
          für unvergessliche Veranstaltungen.
        </p>
      </div>

      <nav aria-labelledby="ftr-nav">
        <p id="ftr-nav" class="label ftr__h">Navigation</p>
        <ul class="ftr__list">
          <li><NuxtLink to="/produkte">Produkte</NuxtLink></li>
          <li><NuxtLink to="/pakete">Pakete</NuxtLink></li>
          <li><NuxtLink to="/ueber-uns">Über uns</NuxtLink></li>
          <li><NuxtLink to="/kontakt">Kontakt</NuxtLink></li>
        </ul>
      </nav>

      <div>
        <p class="label ftr__h">Kontakt</p>
        <ul class="ftr__list">
          <li><a :href="`tel:${contact.phoneRaw}`">{{ contact.phone }}</a></li>
          <li><a :href="`mailto:${contact.email}`">{{ contact.email }}</a></li>
          <li>{{ contact.district }}</li>
        </ul>
      </div>

      <nav aria-labelledby="ftr-legal">
        <p id="ftr-legal" class="label ftr__h">Rechtliches</p>
        <ul class="ftr__list">
          <li><NuxtLink to="/impressum">Impressum</NuxtLink></li>
          <li><NuxtLink to="/datenschutz">Datenschutz</NuxtLink></li>
          <li><NuxtLink to="/agb">AGB</NuxtLink></li>
          <li><NuxtLink to="/widerruf">Widerrufsbelehrung</NuxtLink></li>
        </ul>
      </nav>
    </div>

    <div class="shell ftr__base">
      <p class="muted">&copy; {{ year }} Otto's Event Service</p>
      <p class="muted">Instagram &middot; TikTok</p>
    </div>
  </footer>
</template>

<style scoped>
.ftr { padding-top: var(--s-8); }
.ftr__grid {
  display: grid; gap: var(--s-6);
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  padding-bottom: var(--s-7);
}
.ftr__grid > :first-child { grid-column: span 1; max-width: 34ch; }

.brand__mark { font-size: 2.25rem; line-height: 1; }
.ftr__claim { margin-top: var(--s-3); font-size: var(--t-small); }

.ftr__h { color: var(--c-gold); margin-bottom: var(--s-4); }
.ftr__list { list-style: none; padding: 0; display: grid; gap: var(--s-2); font-size: var(--t-small); }
.ftr__list a:hover { color: var(--c-gold); }

.ftr__base {
  display: flex; flex-wrap: wrap; gap: var(--s-4);
  justify-content: space-between;
  padding-block: var(--s-4);
  border-top: 1px solid var(--c-gold-hair);
  font-size: var(--t-small);
}
</style>
