<script setup lang="ts">
// Eigene Linkseite statt Linktree: liegt auf der eigenen Domain und
// kann kein Anbieter abschalten. Formensprache aus den Mockups:
// schwarzer Kopfbalken, heller Korpus, kantige Karten mit Goldlinie,
// runde Icon-Plaketten mit Goldring wie ueber den Produktbildern.
definePageMeta({ layout: false })

interface LinkItem {
  label: string
  meta: string
  href?: string
  icon: 'globe' | 'tag' | 'instagram' | 'tiktok'
  soon?: boolean
}

// Die drei Ziele durch die echten Profile ersetzen, sobald sie feststehen.
const contact = useContact()

const links: LinkItem[] = [
  { label: 'Website',       meta: 'ottos-eventservice.de',  icon: 'globe', soon: true },
  { label: 'Kleinanzeigen', meta: 'Unsere Angebote',        icon: 'tag',
    href: 'https://www.kleinanzeigen.de/' },
  { label: 'Instagram',     meta: 'Eindrücke & Aktionen',  icon: 'instagram',
    href: 'https://instagram.com/' },
  { label: 'TikTok',        meta: 'Videos von Events',      icon: 'tiktok',
    href: 'https://tiktok.com/' },
]

useSeoMeta({
  title: 'Links',
  description: "Alle Kanäle von Otto's Event Service auf einen Blick.",
  robots: 'noindex, follow',
})
</script>

<template>
  <div class="page">
    <header class="bar">
      <NuxtImg
        src="/images/oes-logo-hell.png" alt="Otto's Event Service"
        width="900" height="486" class="bar__logo" preload
      />
    </header>

    <main class="body">
      <div class="inner">
        <h1 class="display title">Alles auf einen Blick</h1>

        <!-- Sterntrenner wie unter den Überschriften in den Mockups -->
        <div class="rule" aria-hidden="true">
          <span /><svg viewBox="0 0 24 24" width="10" height="10"><path
            d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3-6.3-4.6L5.7 21 8 13.7 2 9.2h7.6z"
            fill="currentColor" /></svg><span />
        </div>

        <ul class="list">
          <li v-for="l in links" :key="l.label">
            <!-- Ausgegraute Eintraege bewusst als <div>: ein Link ohne Ziel
                 wird von Screenreadern trotzdem als Link angekündigt. -->
            <component
              :is="l.soon ? 'div' : 'a'"
              :href="l.href"
              :target="l.soon ? undefined : '_blank'"
              :rel="l.soon ? undefined : 'noopener'"
              class="row" :class="{ 'row--soon': l.soon }"
            >
              <svg
                class="row__icon" aria-hidden="true" viewBox="0 0 24 24"
                width="30" height="30" fill="none" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
              >
                  <template v-if="l.icon === 'globe'">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
                  </template>
                  <template v-else-if="l.icon === 'tag'">
                    <path d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8z" />
                    <circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
                  </template>
                  <template v-else-if="l.icon === 'instagram'">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                  </template>
                  <template v-else>
                    <path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46" />
                    <path d="M14 4c.4 2.2 2 3.7 4.5 3.9" />
                  </template>
              </svg>

              <span class="row__text">
                <span class="label row__label">{{ l.label }}</span>
                <span class="row__meta">{{ l.meta }}</span>
              </span>

              <span v-if="l.soon" class="label row__soon">bald verfügbar</span>
              <svg
                v-else class="row__go" aria-hidden="true" viewBox="0 0 24 24"
                width="15" height="15" fill="none" stroke="currentColor"
                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M5 12h13M12 6l6 6-6 6" />
              </svg>
            </component>
          </li>
        </ul>

        <p class="tel">
          <a :href="`tel:${contact.phoneRaw}`">{{ contact.phone }}</a>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; display: flex; flex-direction: column; background: var(--c-paper); }

/* ---- Schwarzer Kopfbalken, wie auf jeder Mockup-Seite ---- */
.bar {
  background: var(--c-ink);
  padding: var(--s-5) var(--s-4);
  display: grid; place-items: center;
}
.bar__logo { width: clamp(112px, 32vw, 140px); height: auto; }

/* ---- Korpus ---- */
.body { flex: 1; padding: clamp(2.25rem, 7vw, 3.5rem) var(--s-4) var(--s-8); }
.inner { width: 100%; max-width: 440px; margin-inline: auto; }

.title { font-size: clamp(1.6rem, 6vw, 2rem); text-align: center; }

.rule {
  display: flex; align-items: center; gap: var(--s-2);
  color: var(--c-gold); width: 140px; margin: var(--s-3) auto var(--s-7);
}
.rule span { flex: 1; height: 1px; background: var(--c-gold-hair); }

/* ---- Zeilen ---- */
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-3); }

.row {
  display: flex; align-items: center; gap: var(--s-4);
  padding: var(--s-4) var(--s-5);
  background: var(--c-gold);
  color: #FFFFFF;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: background var(--d-fast) var(--e-out);
}
a.row:hover { background: var(--c-gold-lift); }

.row__icon { flex: none; }

.row__text { display: grid; gap: 2px; min-width: 0; }
.row__label { font-size: 0.8125rem; color: #FFFFFF; }
.row__meta {
  font-size: var(--t-small);
  color: rgb(255 255 255 / 0.82);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.row__go { flex: none; margin-left: auto; color: #FFFFFF; }

.row__soon {
  flex: none; margin-left: auto;
  font-size: 0.5625rem; color: var(--c-text-muted);
}

/* ---- Telefon ---- */
.tel { margin-top: var(--s-7); text-align: center; }
.tel a {
  font-size: 1.0625rem; letter-spacing: 0.02em;
  border-bottom: 1px solid var(--c-gold-hair);
  padding-bottom: 2px;
}
.tel a:hover { color: var(--c-gold); border-color: var(--c-gold); }

/* Ausgegraut: gestrichelte Kontur, keine Fuellung */
.row--soon {
  background: transparent;
  border: 1px dashed #BFB8AC;
  color: var(--c-text-muted);
}
.row--soon .row__label { color: var(--c-text-muted); }
.row--soon .row__meta { color: var(--c-text-muted); }
</style>
