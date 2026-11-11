<script setup lang="ts">
// Hinweis im Fliesstext: Goldbalken links, zarte Goldflaeche, Info-Symbol.
// Der eine Hinweis-Stil der Seite (STYLEGUIDE.md "Hinweise"). ton="fehler"
// fuer etwas, das der Kunde noch erledigen muss, ton="erfolg" fuer eine
// kurze Bestaetigung ("Im Warenkorb"). Rechts optional ein Knopf oder Link
// ueber den Slot "aktion".
const { ton = 'info' } = defineProps<{ ton?: 'info' | 'fehler' | 'erfolg' }>()
const symbol = { info: 'info', fehler: 'alert', erfolg: 'check' } as const
</script>

<template>
  <div class="hw" :class="`hw--${ton}`" :role="ton === 'fehler' ? 'alert' : ton === 'erfolg' ? 'status' : undefined">
    <p class="hw__text">
      <UiIcon :name="symbol[ton]" :size="14" class="hw__icon" />
      <span><slot /></span>
    </p>
    <div v-if="$slots.aktion" class="hw__aktion"><slot name="aktion" /></div>
  </div>
</template>

<style scoped>
.hw {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  font-size: var(--t-small); line-height: 1.45;
  background: var(--c-gold-tint); border-left: 2px solid var(--c-gold);
}
.hw--fehler { background: var(--c-danger-tint); border-left-color: var(--c-danger); }
.hw__text { display: flex; align-items: flex-start; gap: 0.45rem; flex: 1; min-width: 12rem; }
.hw__icon { flex: none; margin-top: 0.15rem; color: var(--c-gold); }
.hw--fehler .hw__icon { color: var(--c-danger); }
.hw--erfolg { background: var(--c-success-tint); border-left-color: var(--c-success); }
.hw--erfolg .hw__icon { color: var(--c-success); }
.hw__aktion :deep(a) { font-weight: 600; color: var(--c-text); text-decoration: underline; text-underline-offset: 2px; }
.hw__text :deep(a) { color: var(--c-text); text-decoration: underline; text-underline-offset: 2px; }
</style>
