<script setup lang="ts">
// Fehler zu einem einzelnen Feld oder einer Auswahl, direkt darunter.
// UiField nutzt ihn selbst; ausserhalb von UiField (Sterne, Haekchen,
// Layouts, Upload) direkt einsetzen. Fehler zum ganzen Formular:
// UiHinweis ton="fehler" (STYLEGUIDE.md "Fehler").
defineProps<{ id?: string }>()
</script>

<template>
  <p :id="id" class="fe" role="alert">
    <UiIcon name="alert" :size="14" class="fe__icon" /><span><slot /></span>
  </p>
</template>

<style scoped>
.fe { display: flex; align-items: flex-start; gap: 0.4rem; font-size: var(--t-xs); line-height: 1.4; color: var(--c-danger); }
.fe__icon { flex: none; margin-top: 0.1rem; }
</style>
