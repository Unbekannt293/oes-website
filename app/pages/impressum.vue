<script setup lang="ts">
// Bewusst ohne Header/Footer: eine reine Rechtsseite ohne Navigation zu
// Seiten, die noch nicht fertig sind. tel:/mailto: bleiben, weil § 5 DDG
// einen schnellen elektronischen Kontaktweg verlangt - das ist keine
// Navigation, sondern die Pflichtangabe selbst.
definePageMeta({ layout: false })

const contact = useContact()

useSeoMeta({
  title: 'Impressum',
  robots: 'noindex, follow',
})
</script>

<template>
  <div class="page">
    <main class="body">
      <div class="inner">
        <h1 class="display title">Impressum</h1>

        <div class="rule" aria-hidden="true">
          <span /><svg viewBox="0 0 24 24" width="10" height="10"><path
            d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3-6.3-4.6L5.7 21 8 13.7 2 9.2h7.6z"
            fill="currentColor" /></svg><span />
        </div>

        <section>
          <h2 class="label">Angaben gemäß § 5 DDG</h2>
          <p>
            {{ contact.legal.name }}<br>
            {{ contact.legal.businessName }}<br>
            {{ contact.legal.street }}<br>
            {{ contact.legal.zip }} {{ contact.legal.city }}<br>
            {{ contact.legal.country }}
          </p>
        </section>

        <section>
          <h2 class="label">Kontakt</h2>
          <p>
            Telefon: <a :href="`tel:${contact.phoneRaw}`">{{ contact.legal.phone }}</a><br>
            E-Mail: <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; background: var(--c-paper); }

.body { padding: clamp(3rem, 8vw, 5rem) var(--s-4); }
.inner { width: 100%; max-width: 440px; margin-inline: auto; }

.title { font-size: clamp(1.9rem, 6vw, 2.5rem); text-align: center; }

.rule {
  display: flex; align-items: center; gap: var(--s-2);
  color: var(--c-gold); width: 140px; margin: var(--s-3) auto var(--s-8);
}
.rule span { flex: 1; height: 1px; background: var(--c-gold-hair); }

section + section { margin-top: var(--s-6); }
h2 { color: var(--c-gold); margin-bottom: var(--s-2); }
p { line-height: 1.7; }
a:hover { color: var(--c-gold); }
</style>
