<script setup lang="ts">
// Erfolgsansicht nach dem Absenden (Bestellung, Bewertung, Kontakt):
// goldener Haken im Kreis, Titel, Text, darunter Knoepfe (Slot "aktion").
defineProps<{ titel: string }>()
</script>

<template>
  <div class="er" role="status" tabindex="-1">
    <span class="er__haken"><UiIcon name="check" :size="26" /></span>
    <h2 class="display er__titel">{{ titel }}</h2>
    <div class="er__text"><slot /></div>
    <div v-if="$slots.aktion" class="er__aktion"><slot name="aktion" /></div>
  </div>
</template>

<style scoped>
.er { display: grid; justify-items: center; gap: var(--s-3); padding: var(--s-6) 0; text-align: center; outline: none; }
.er__haken {
  display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 50%;
  color: var(--c-gold); border: 1px solid var(--c-gold);
}
.er__titel { font-size: var(--t-h3); }
.er__text { display: grid; gap: var(--s-2); max-width: 30rem; color: var(--c-text-muted); }
.er__text :deep(strong) { color: var(--c-text); }
.er__aktion { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s-3); margin-top: var(--s-2); }
</style>
