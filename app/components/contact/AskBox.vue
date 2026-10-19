<script setup lang="ts">
// Schwarzer Kasten "Haben Sie Fragen?" mit Telefon, Mail und Kontaktknopf.
// Auf Produktseite und Startseite, wie in Louis' Entwurf. Drei Gruppen
// (Kopf, Kontaktwege, Knopf): wird der Kasten hoeher als sein Inhalt (auf
// der Startseite so hoch wie der Bewertungskasten), verteilen sie sich
// gleichmaessig statt unten Leerraum zu lassen.
const contact = useContact()
</script>

<template>
  <div class="ask on-ink">
    <div class="ask__head">
      <p class="display ask__h">Haben Sie Fragen?</p>
      <p class="ask__sub">Wir beraten Sie gern persönlich.</p>
    </div>
    <div class="ask__rows">
      <a :href="`tel:${contact.phoneRaw}`" class="ask__row"><UiIcon name="phone" :size="16" /> {{ contact.phone }}</a>
      <a :href="`mailto:${contact.email}`" class="ask__row"><UiIcon name="mail" :size="16" /> {{ contact.email }}</a>
    </div>
    <UiButton to="/kontakt" variant="solid" size="sm" class="ask__btn">Kontakt aufnehmen</UiButton>
  </div>
</template>

<style scoped>
.ask {
  display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;
  gap: var(--s-5);
  padding: var(--s-6) var(--s-5);
  border-radius: var(--r-md);
}
.ask__head, .ask__rows { display: grid; gap: var(--s-2); }
.ask__h { font-size: var(--t-h3); }
.ask__sub { color: var(--c-text-muted); font-size: var(--t-small); }
.ask__row { display: inline-flex; align-items: center; gap: var(--s-2); font-size: var(--t-small); }
.ask__row svg { color: var(--c-gold); }
.ask__row:hover { color: var(--c-gold); }
</style>
