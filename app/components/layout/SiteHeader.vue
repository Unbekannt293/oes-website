<script setup lang="ts">
const nav = [
  { to: '/',           label: 'Startseite' },
  { to: '/produkte',   label: 'Produkte' },
  { to: '/pakete',     label: 'Pakete' },
  { to: '/ueber-uns',  label: 'Über uns' },
  { to: '/kontakt',    label: 'Kontakt' },
]

const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
</script>

<template>
  <header class="hdr on-ink">
    <a href="#inhalt" class="visually-hidden">Zum Inhalt springen</a>

    <div class="hdr__bar">
      <NuxtLink to="/" class="brand" aria-label="OES, Otto's Event Service, zur Startseite">
        <span class="brand__mark display">OES</span>
        <span class="brand__sub label">Otto's Event Service</span>
      </NuxtLink>

      <nav
        id="hauptnavigation" class="hdr__nav" :class="{ 'is-open': open }"
        aria-label="Hauptnavigation"
      >
        <div class="hdr__navinner">
          <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" class="label hdr__link">
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <div class="hdr__actions">
        <UiButton to="/warenkorb" variant="solid" size="sm">Warenkorb</UiButton>
        <button
          class="hdr__burger" :aria-expanded="open"
          aria-controls="hauptnavigation" @click="open = !open"
        >
          <span class="visually-hidden">Menü</span>
          <span aria-hidden="true">{{ open ? '✕' : '☰' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hdr { position: sticky; top: 0; z-index: var(--z-header); }

.hdr__bar {
  display: flex; align-items: center; gap: var(--s-5);
  max-width: var(--content-w); margin-inline: auto;
  padding: var(--s-4) var(--gutter);
}

.brand { display: grid; gap: 2px; margin-right: auto; }
.brand__mark { font-size: 2rem; line-height: 1; letter-spacing: 0.02em; }
.brand__sub  { font-size: 0.5rem; color: var(--c-text-muted); letter-spacing: 0.2em; }

.hdr__navinner { display: flex; gap: clamp(1rem, 2.2vw, 2.25rem); }
.hdr__link { position: relative; padding-block: var(--s-2); color: var(--c-text-onink); }
.hdr__link::after {
  content: ''; position: absolute; inset-inline: 0; bottom: 0;
  height: 1px; background: var(--c-gold);
  transform: scaleX(0); transform-origin: left;
  transition: transform var(--d-base) var(--e-out);
}
.hdr__link:hover::after,
.hdr__link.router-link-active::after { transform: scaleX(1); }

.hdr__actions { display: flex; align-items: center; gap: var(--s-3); }
.hdr__burger { display: none; color: var(--c-text-onink); font-size: 1.25rem; padding: var(--s-2); }

@media (max-width: 900px) {
  .hdr__burger { display: block; }
  .hdr__nav {
    position: absolute; inset-inline: 0; top: 100%;
    background: var(--c-ink);
    /* grid-template-rows 0fr -> 1fr animiert eine Höhe, die man nicht kennt.
       Funktioniert nur mit genau einem Kind, daher hdr__navinner. */
    display: grid; grid-template-rows: 0fr;
    transition: grid-template-rows var(--d-base) var(--e-out);
    overflow: hidden;
  }
  .hdr__nav.is-open { grid-template-rows: 1fr; }
  .hdr__navinner {
    min-height: 0; flex-direction: column; gap: 0;
    border-top: 1px solid var(--c-gold-hair);
  }
  .hdr__link { padding: var(--s-4) var(--gutter); }
}
</style>
