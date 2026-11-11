<script setup lang="ts">
// Verwaltung fuer Louis: schlichter Kopf mit drei Bereichen, kein
// Seitenmenue und kein Footer. Auf dem Handy gut mit dem Daumen bedienbar.
const route = useRoute()
const { abmelden } = useAdmin()
const bereiche = [
  { to: '/admin/buchungen', label: 'Buchungen' },
  { to: '/admin/sperrtage', label: 'Sperrtage' },
  { to: '/admin/bewertungen', label: 'Bewertungen' },
  { to: '/admin/preise', label: 'Preise' },
]
const angemeldet = computed(() => route.path !== '/admin/anmelden')
</script>

<template>
  <div class="adm">
    <header class="adm__bar on-ink">
      <div class="shell adm__bar-in">
        <NuxtLink to="/admin/buchungen" class="adm__brand">
          <img src="/images/oes-logo-hell.png" alt="OES" width="900" height="486" class="adm__logo">
          <span class="label">Verwaltung</span>
        </NuxtLink>
        <div v-if="angemeldet" class="adm__right">
          <NuxtLink to="/" class="adm__link adm__link--web">Zur Website</NuxtLink>
          <button type="button" class="adm__link" @click="abmelden">Abmelden</button>
        </div>
      </div>
      <nav v-if="angemeldet" class="shell adm__nav" aria-label="Verwaltung">
        <NuxtLink v-for="b in bereiche" :key="b.to" :to="b.to" class="adm__tab">{{ b.label }}</NuxtLink>
      </nav>
    </header>
    <main class="shell adm__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.adm { min-height: 100dvh; background: var(--c-paper); }
.adm__bar {
  background:
    radial-gradient(45% 150% at 0% 0%, var(--c-gold-glow), transparent 70%),
    radial-gradient(45% 150% at 100% 0%, var(--c-gold-glow), transparent 70%),
    var(--c-buehne);
}
.adm__bar-in { display: flex; align-items: center; justify-content: space-between; gap: var(--s-4); padding-block: var(--s-4); }
.adm__brand { display: inline-flex; align-items: center; gap: var(--s-3); color: var(--c-gold); }
.adm__logo { width: 3.5rem; height: auto; }
.adm__right { display: flex; gap: var(--s-4); }
.adm__link { font-size: var(--t-small); color: var(--c-text-muted); white-space: nowrap; }
.adm__link:hover { color: var(--c-gold); }
@media (max-width: 480px) { .adm__link--web { display: none; } }
.adm__nav { display: flex; gap: var(--s-5); overflow-x: auto; }
.adm__tab {
  padding: var(--s-3) 0; border-bottom: 2px solid transparent;
  font-size: var(--t-label); font-weight: 600; letter-spacing: var(--tr-label); text-transform: uppercase;
  color: var(--c-text-muted); white-space: nowrap;
}
.adm__tab:hover { color: var(--c-text); }
.adm__tab.router-link-active { color: var(--c-gold); border-bottom-color: var(--c-gold); }
.adm__main { padding-block: var(--s-6) var(--s-9, 5rem); }
</style>
