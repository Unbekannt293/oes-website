<script setup lang="ts">
const contact = useContact()

useSeoMeta({
  title: 'Impressum',
  robots: 'noindex, follow',
})
</script>

<template>
  <div class="section shell">
    <SectionHeading title="Impressum" align="start" />

    <div class="legal prose">
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
  </div>
</template>

<style scoped>
.legal { display: grid; gap: var(--s-6); margin-top: var(--s-6); }
.legal h2 { color: var(--c-gold); margin-bottom: var(--s-2); }
.legal a:hover { color: var(--c-gold); }
</style>
