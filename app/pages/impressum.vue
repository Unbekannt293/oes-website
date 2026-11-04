<script setup lang="ts">
// Impressum im normalen Seitenlayout (seit dem Go-live, vorher stand es ohne
// Menue neben der Linkseite). tel:/mailto: erfuellen den schnellen
// elektronischen Kontaktweg nach § 5 DDG.
import { FIRMA } from '~~/shared/firma'

const contact = useContact()

useSeoMeta({
  title: 'Impressum',
  robots: 'noindex, follow',
})
</script>

<template>
  <div>
    <PageHero crumb="Impressum" title="Impressum" sub="Angaben zum Anbieter dieser Website." layout="stack" />
    <div class="section shell im">
      <section class="im__box">
        <h2 class="label im__h">Angaben gemäß § 5 DDG</h2>
        <p>
          {{ contact.legal.businessName }}<br>
          Inhaber: {{ contact.legal.name }}<br>
          {{ contact.legal.street }}<br>
          {{ contact.legal.zip }} {{ contact.legal.city }}<br>
          {{ contact.legal.country }}
        </p>
      </section>

      <section class="im__box">
        <h2 class="label im__h">Kontakt</h2>
        <p>
          Telefon: <a :href="`tel:${contact.phoneRaw}`">{{ contact.legal.phone }}</a><br>
          E-Mail: <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
        </p>
      </section>

      <section class="im__box">
        <h2 class="label im__h">Umsatzsteuer</h2>
        <p>{{ FIRMA.steuerhinweis }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.im { display: grid; gap: var(--s-4); max-width: 40rem; }
.im__box { display: grid; gap: var(--s-3); padding: var(--s-5) var(--s-6); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); line-height: 1.7; }
.im__h { color: var(--c-gold); }
.im__box a { text-decoration: underline; text-underline-offset: 2px; }
.im__box a:hover { color: var(--c-gold); }
</style>
