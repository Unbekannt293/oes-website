<script setup lang="ts">
defineProps<{ title: string, sub?: string, align?: 'center' | 'start' }>()
</script>

<template>
  <header class="head" :class="align === 'start' ? 'head--start' : 'head--center'">
    <h2 class="display head__title">{{ title }}</h2>
    <!-- Goldener Trenner aus den Mockups, mit dem Funken aus dem Logo. -->
    <div class="head__rule" aria-hidden="true">
      <span /><UiIcon name="funke" :size="12" /><span />
    </div>
    <p v-if="sub" class="head__sub muted">{{ sub }}</p>
  </header>
</template>

<style scoped>
.head { display: grid; gap: var(--s-3); margin-bottom: var(--s-7); }
.head--center { justify-items: center; text-align: center; }
.head--start  { justify-items: start; }

/* Gleiche Groesse wie jede Abschnittsueberschrift (.h-col, --t-h2). */
.head__title { font-size: var(--t-h2); }

.head__rule {
  display: flex; align-items: center; gap: var(--s-2);
  color: var(--c-gold); width: min(220px, 60%);
}
.head--start .head__rule { width: 140px; }
.head__rule span { flex: 1; height: 1px; background: var(--c-gold-hair); }

.head__sub { font-size: var(--t-body); max-width: 46ch; }
</style>
