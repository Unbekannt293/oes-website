<script setup lang="ts">
// Sterne zum Anzeigen, auch halbe (4,5): goldene Sterne als Maske ueber
// grauen, Breite = Anteil. Fuer Screenreader zaehlt nur das Label.
const { value, size = 16 } = defineProps<{ value: number, size?: number }>()
const label = computed(() => `${value.toLocaleString('de-DE')} von 5 Sternen`)
</script>

<template>
  <span class="rs" role="img" :aria-label="label" :style="{ '--rs-size': `${size}px` }">
    <span class="rs__row rs__row--off" aria-hidden="true">
      <UiIcon v-for="i in 5" :key="i" name="star" :size="size" />
    </span>
    <span class="rs__row rs__row--on" aria-hidden="true" :style="{ width: `${(value / 5) * 100}%` }">
      <UiIcon v-for="i in 5" :key="i" name="star" :size="size" />
    </span>
  </span>
</template>

<style scoped>
/* width: max-content, damit die Fuellbreite (Anteil) sich immer auf die fuenf
   Sterne bezieht. Als Grid- oder Flex-Kind wuerde .rs sonst auf die volle
   Spaltenbreite gestreckt, und 86 % davon deckten alle Sterne ab. */
.rs { position: relative; display: inline-block; width: max-content; justify-self: start; line-height: 0; vertical-align: middle; }
.rs__row { display: inline-flex; gap: 2px; white-space: nowrap; }
.rs__row :deep(svg) { flex: none; fill: currentColor; stroke-width: 1; }
.rs__row--off { color: #D9D1C3; }
.rs__row--on { position: absolute; inset: 0 auto 0 0; overflow: hidden; color: var(--c-gold); }
</style>
