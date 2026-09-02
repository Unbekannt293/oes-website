<script setup lang="ts">
interface Props {
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  to?: string
}
const { variant = 'solid', size = 'md', to } = defineProps<Props>()
// Als Link rendern, wenn ein Ziel da ist. Sonst als echter Button,
// damit Tastatur und Screenreader das Richtige tun.
const tag = computed(() => (to ? resolveComponent('NuxtLink') : 'button'))
</script>

<template>
  <component :is="tag" :to="to" class="btn" :class="[`btn--${variant}`, `btn--${size}`]">
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  font-size: var(--t-label);
  font-weight: 600;
  letter-spacing: var(--tr-label);
  text-transform: uppercase;
  border-radius: var(--r-sm);
  transition: background var(--d-fast) var(--e-out),
              color var(--d-fast) var(--e-out),
              border-color var(--d-fast) var(--e-out);
}
.btn--sm { padding: 0.55rem 1rem; }
.btn--md { padding: 0.8rem 1.6rem; }
.btn--lg { padding: 1.05rem 2.4rem; font-size: 0.75rem; }

.btn--solid   { background: var(--c-gold); color: #17140D; }
.btn--solid:hover   { background: var(--c-gold-lift); }

.btn--outline { border: 1px solid var(--c-gold); color: var(--c-gold); }
.btn--outline:hover { background: var(--c-gold); color: #17140D; }

.btn--ghost   { color: var(--c-text); border: 1px solid var(--c-gold-hair); }
.btn--ghost:hover   { border-color: var(--c-gold); color: var(--c-gold); }
</style>
