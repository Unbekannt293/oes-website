<script setup lang="ts">
defineProps<{ title: string, sub?: string, align?: 'center' | 'start' }>()
</script>

<template>
  <header class="head" :class="align === 'start' ? 'head--start' : 'head--center'">
    <h2 class="display head__title">{{ title }}</h2>
    <!-- Der goldene Stern-Trenner aus den Mockups -->
    <div class="head__rule" aria-hidden="true">
      <span /><svg viewBox="0 0 24 24" width="11" height="11"><path
        d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3-6.3-4.6L5.7 21 8 13.7 2 9.2h7.6z"
        fill="currentColor" /></svg><span />
    </div>
    <p v-if="sub" class="head__sub muted">{{ sub }}</p>
  </header>
</template>

<style scoped>
.head { display: grid; gap: var(--s-3); margin-bottom: var(--s-7); }
.head--center { justify-items: center; text-align: center; }
.head--start  { justify-items: start; }

.head__title { font-size: var(--t-h1); }

.head__rule {
  display: flex; align-items: center; gap: var(--s-2);
  color: var(--c-gold); width: min(220px, 60%);
}
.head--start .head__rule { width: 140px; }
.head__rule span { flex: 1; height: 1px; background: var(--c-gold-hair); }

.head__sub { font-size: var(--t-body); max-width: 46ch; }
</style>
