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

// Auch Unterseiten markieren: /produkte/fotobox gehoert zu "Produkte".
// router-link-active greift dort nicht, weil die Detailseite keine
// Kindroute der Produktliste ist.
function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

const { count } = useCart()

</script>

<template>
  <header class="hdr on-ink">
    <a href="#inhalt" class="visually-hidden">Zum Inhalt springen</a>

    <div class="hdr__bar">
      <NuxtLink to="/" class="brand" aria-label="OES, Otto's Event Service, zur Startseite">
        <img
          src="/images/oes-logo-hell.webp" alt="" class="brand__logo"
          width="360" height="194"
        >
      </NuxtLink>

      <nav
        id="hauptnavigation" class="hdr__nav" :class="{ 'is-open': open }"
        aria-label="Hauptnavigation"
      >
        <div class="hdr__navinner">
          <NuxtLink
            v-for="item in nav" :key="item.to" :to="item.to"
            class="label hdr__link" :class="{ 'is-active': isActive(item.to) }"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <div class="hdr__actions">
        <UiButton to="/warenkorb" variant="outline" size="sm" class="hdr__cart">
          <UiIcon name="cart" :size="17" />
          <span class="hdr__cart-label">Warenkorb</span>
          <span v-if="count" class="hdr__badge" aria-hidden="true">{{ count }}</span>
          <span class="visually-hidden">{{ count ? `, ${count} Positionen` : ', leer' }}</span>
        </UiButton>
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

/* Drei Spalten, die aeusseren gleich breit: so steht die Navigation
   wirklich in der Mitte, egal wie breit Logo und Warenkorb sind.
   Wunsch aus Louis' Unterlagen. */
.hdr__bar {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; gap: var(--s-5);
  max-width: var(--content-w); margin-inline: auto;
  padding: var(--s-4) var(--gutter);
}

/* Spalten fest zuweisen: mobil ist die Navigation absolut positioniert
   und belegt keine Zelle, sonst rutschte der Warenkorb in die Mitte. */
.brand { display: block; grid-column: 1; justify-self: start; }
.hdr__nav { grid-column: 2; }
.hdr__actions { grid-column: 3; justify-self: end; }
/* Das Logo traegt den Schriftzug selbst, der Link hat ein aria-label. */
.brand__logo { height: 46px; width: auto; }

.hdr__navinner { display: flex; gap: clamp(1rem, 2.2vw, 2.25rem); }
.hdr__link { position: relative; padding-block: var(--s-2); color: var(--c-text-onink); }
.hdr__link::after {
  content: ''; position: absolute; inset-inline: 0; bottom: 0;
  height: 1px; background: var(--c-gold);
  transform: scaleX(0); transform-origin: left;
  transition: transform var(--d-base) var(--e-out);
}
.hdr__link:hover::after,
.hdr__link.is-active::after { transform: scaleX(1); }

.hdr__cart { position: relative; }
/* Anzahl als kleiner Kreis an der Ecke: der Knopf bleibt gleich breit,
   egal ob leer oder voll. */
.hdr__badge {
  position: absolute; top: -0.5rem; right: -0.5rem;
  display: grid; place-items: center;
  min-width: 1.2rem; height: 1.2rem; padding-inline: 0.3rem;
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0;
  color: var(--c-ink); background: var(--c-gold);
  border: 2px solid var(--c-ink);
  border-radius: 999px;
}

.hdr__actions { display: flex; align-items: center; gap: var(--s-3); }
.hdr__burger { display: none; color: var(--c-text-onink); font-size: 1.25rem; padding: var(--s-2); }

@media (max-width: 900px) {
  .hdr__burger { display: block; }
  .hdr__cart-label { display: none; }
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
