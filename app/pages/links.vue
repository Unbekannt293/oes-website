<script setup lang="ts">
// Eigene Linkseite statt Linktree: liegt auf der eigenen Domain,
// kostet nichts und kann niemand abschalten.
definePageMeta({ layout: false })

const contact = useContact()

interface LinkItem {
  label: string
  /** Wird unter dem Titel angezeigt, so wie im Instagram-Linkmenue. */
  display: string
  href?: string
  icon: 'globe' | 'tag' | 'instagram' | 'tiktok'
  /** Ausgegraut, solange es das Ziel noch nicht gibt. */
  soon?: boolean
}

// Die drei Platzhalter unten durch die echten Profile ersetzen,
// sobald Louis sie durchgegeben hat.
const links: LinkItem[] = [
  {
    label: 'Website', display: 'ottos-eventservice.de',
    icon: 'globe', soon: true,
  },
  {
    label: 'Kleinanzeigen', display: 'kleinanzeigen.de',
    href: 'https://www.kleinanzeigen.de/', icon: 'tag',
  },
  {
    label: 'Instagram', display: '@ottos.event.service',
    href: 'https://instagram.com/', icon: 'instagram',
  },
  {
    label: 'TikTok', display: '@ottos.event.service',
    href: 'https://tiktok.com/', icon: 'tiktok',
  },
]

useSeoMeta({
  title: 'Links',
  description: 'Alle Kanäle von Otto\'s Event Service auf einen Blick.',
  robots: 'noindex, follow',
})
</script>

<template>
  <div class="wrap">
    <main class="col">
      <header class="head">
        <NuxtImg
          src="/images/oes-logo-hell.png" alt="Otto's Event Service"
          width="900" height="486" class="head__logo" preload
        />
        <p class="head__claim muted">
          Zelte, Fotoboxen, Musik &amp; mehr – aus Hamburg.
        </p>
      </header>

      <ul class="list">
        <li v-for="l in links" :key="l.label">
          <!-- Ausgegraute Eintraege sind bewusst kein <a>: ein Link,
               der nirgends hinfuehrt, verwirrt Screenreader. -->
          <component
            :is="l.soon ? 'div' : 'a'"
            :href="l.href" :target="l.soon ? undefined : '_blank'"
            :rel="l.soon ? undefined : 'noopener'"
            class="row" :class="{ 'row--soon': l.soon }"
            :aria-disabled="l.soon || undefined"
          >
            <span class="row__thumb" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                   stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round">
                <template v-if="l.icon === 'globe'">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
                </template>
                <template v-else-if="l.icon === 'tag'">
                  <path d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8z" />
                  <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
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
            </span>

            <span class="row__text">
              <span class="row__label">{{ l.label }}</span>
              <span class="row__display muted">{{ l.display }}</span>
            </span>

            <span v-if="l.soon" class="row__badge label">bald</span>
            <svg
              v-else class="row__arrow" aria-hidden="true" viewBox="0 0 24 24"
              width="16" height="16" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </component>
        </li>
      </ul>

      <footer class="foot">
        <a :href="`tel:${contact.phoneRaw}`">{{ contact.phone }}</a>
        <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
        <NuxtLink to="/impressum" class="foot__legal muted">Impressum</NuxtLink>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.wrap {
  min-height: 100dvh;
  background: var(--c-ink);
  color: var(--c-text-onink);
  display: grid; place-items: start center;
  padding: clamp(2.5rem, 8vw, 4.5rem) var(--s-4);
}
.muted { color: #A9A296; }

.col { width: 100%; max-width: 480px; }

/* ---- Kopf ---- */
.head { text-align: center; margin-bottom: var(--s-7); }
.head__logo { width: clamp(150px, 46vw, 200px); margin-inline: auto; height: auto; }
.head__claim { margin-top: var(--s-4); font-size: var(--t-small); }

/* ---- Linkliste ---- */
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-3); }

.row {
  display: flex; align-items: center; gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  background: #171614;
  border: 1px solid #2B2822;
  border-radius: 14px;
  transition: border-color var(--d-fast) var(--e-out),
              background var(--d-fast) var(--e-out),
              transform var(--d-fast) var(--e-out);
}
a.row:hover {
  background: #1D1B18;
  border-color: var(--c-gold);
  transform: translateY(-1px);
}
a.row:active { transform: none; }

.row__thumb {
  flex: none;
  width: 46px; height: 46px;
  display: grid; place-items: center;
  border-radius: 10px;
  background: #221F1A;
  color: var(--c-gold);
}

.row__text { display: grid; gap: 1px; min-width: 0; }
.row__label { font-weight: 600; font-size: 0.95rem; }
.row__display {
  font-size: 0.8125rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.row__arrow { flex: none; margin-left: auto; color: #6B6660; }
a.row:hover .row__arrow { color: var(--c-gold); }

.row__badge {
  flex: none; margin-left: auto;
  padding: 0.3rem 0.55rem;
  border: 1px solid #3A342A; border-radius: 999px;
  color: #8A8378; font-size: 0.625rem;
}

/* Ausgegraut: sichtbar vorhanden, aber klar noch nicht nutzbar. */
.row--soon { opacity: 0.45; cursor: default; }
.row--soon .row__thumb { color: #6B6660; }

/* ---- Fuss ---- */
.foot {
  margin-top: var(--s-7);
  display: grid; gap: var(--s-2); justify-items: center;
  font-size: var(--t-small);
}
.foot a:hover { color: var(--c-gold); }
.foot__legal { font-size: 0.75rem; margin-top: var(--s-2); }
</style>
