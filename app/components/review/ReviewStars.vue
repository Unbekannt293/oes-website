<script setup lang="ts">
// Bewertung als fuenf OES-Funken (der Vierzack aus dem Logo, Lukas
// 12.11.2026). Jeder Funke wird einzeln gefuellt, auch anteilig: 4,3 =
// vier volle und ein zu 30 % gefuellter. Fuer Screenreader zaehlt nur das Label.
const { value, size = 16 } = defineProps<{ value: number, size?: number }>()
const label = computed(() => `${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })} von 5 Sternen`)
const anteil = (i: number) => Math.min(1, Math.max(0, value - (i - 1)))
// Der Funke ist schlanker als ein Stern: groesser zeichnen, damit er gleich gross wirkt.
const px = computed(() => Math.round(size * 1.3))
</script>

<template>
  <span class="rs" role="img" :aria-label="label">
    <span v-for="i in 5" :key="i" class="rs__funke" aria-hidden="true">
      <UiIcon name="funke" :size="px" class="rs__aus" />
      <span v-if="anteil(i) > 0" class="rs__an" :style="{ width: `${anteil(i) * 100}%` }">
        <UiIcon name="funke" :size="px" />
      </span>
    </span>
  </span>
</template>

<style scoped>
/* width: max-content: als Grid- oder Flex-Kind sonst auf volle Breite gestreckt. */
.rs { display: inline-flex; gap: 0; width: max-content; justify-self: start; line-height: 0; vertical-align: middle; }
.rs__funke { position: relative; display: inline-block; line-height: 0; }
.rs__aus { color: #D9D1C3; }
.rs__an { position: absolute; inset: 0 auto 0 0; overflow: hidden; color: var(--c-gold); }
/* Die Grundregel svg { max-width: 100% } wuerde den Funken auf die Breite
   des Ausschnitts verkleinern. Er soll aber voll gross bleiben und nur
   abgeschnitten werden: 4,3 = ein Drittel des fuenften Funkens. */
.rs__an :deep(svg) { flex: none; max-width: none; width: auto; height: auto; }
</style>
