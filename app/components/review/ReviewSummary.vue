<script setup lang="ts">
import { formatSchnitt, zusammenfassung } from '~~/shared/bewertungen'

// Kleine Zeile ueber "Haben Sie Fragen?": Schnitt aller Bewertungen.
// Klick oeffnet die Uebersicht, dort kann man auch selbst schreiben.
const { alle } = useBewertungen()
const { oeffnen } = useBewertungDialog()
const gesamt = computed(() => zusammenfassung(alle.value))
</script>

<template>
  <button type="button" class="rsum" @click="oeffnen()">
    <ReviewStars :value="gesamt.schnitt" :size="18" />
    <span v-if="gesamt.anzahl" class="rsum__txt">
      <strong>{{ formatSchnitt(gesamt.schnitt) }}</strong>
      <span class="muted">· {{ gesamt.anzahl === 1 ? '1 Bewertung' : `${gesamt.anzahl} Bewertungen` }}</span>
    </span>
    <span v-else class="rsum__txt muted">Noch keine Bewertungen</span>
    <UiIcon name="arrow" :size="14" class="rsum__arrow" />
  </button>
</template>

<style scoped>
.rsum {
  display: flex; align-items: center; gap: var(--s-3); width: 100%;
  padding: var(--s-4) var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
  text-align: left; cursor: pointer;
  transition: border-color var(--d-fast) var(--e-out);
}
.rsum:hover { border-color: var(--c-gold); }
.rsum__txt { font-size: var(--t-small); }
.rsum__arrow { margin-left: auto; color: var(--c-gold); }
</style>
