<script setup lang="ts">
import type { StepState } from '~/composables/useSteps'

// Ein Schritt im Buchungskasten. Offen: schwarz, Inhalt sichtbar.
// Zu: grau, nur die Kopfzeile; fertige Schritte zeigen ihre Wahl und einen
// Haken und lassen sich per Klick wieder oeffnen. Gesperrte (vorheriger
// Schritt nicht fertig) reagieren nicht.
const { n, title, state, summary = '' } = defineProps<{
  n: number
  title: string
  state: StepState
  /** Kurzfassung der Wahl, steht im zugeklappten Kopf, z. B. "Sa., 24.10.2026". */
  summary?: string
}>()
const emit = defineEmits<{ open: [] }>()

const id = useId()
const isOpen = computed(() => state === 'active')
</script>

<template>
  <section class="st" :class="`st--${state}`">
    <h3 class="st__h">
      <button
        type="button" class="st__head"
        :disabled="state === 'locked'"
        :aria-expanded="isOpen" :aria-controls="id"
        @click="isOpen || emit('open')"
      >
        <span class="st__no">{{ n }}</span>
        <span class="st__text">
          <span class="st__title">{{ title }}</span>
          <span v-if="state === 'done' && summary" class="st__val">{{ summary }}</span>
        </span>
        <UiIcon v-if="state === 'done'" name="check" :size="16" class="st__check" />
      </button>
    </h3>
    <!-- Immer im DOM, damit das Auf- und Zuklappen weich laeuft; zugeklappt
         per inert fuer Tastatur und Screenreader unerreichbar. -->
    <div :id="id" class="st__body" :inert="!isOpen">
      <div class="st__inner"><slot /></div>
    </div>
  </section>
</template>

<style scoped>
.st + .st { border-top: 1px solid var(--c-gold-hair); }

.st__h { margin: 0; font: inherit; }
.st__head {
  display: flex; align-items: center; gap: var(--s-2);
  width: 100%; padding: var(--s-3) 0;
  text-align: left; font-size: 0.9375rem; font-weight: 600;
  color: var(--c-text-muted);
  transition: color var(--d-fast) var(--e-out);
}
.st__head:disabled { cursor: default; opacity: 0.55; }
.st--done .st__head:hover { color: var(--c-text); }
.st--todo .st__head:hover { color: var(--c-text); }
.st--active .st__head { color: var(--c-text); cursor: default; }

.st__no {
  align-self: flex-start; margin-top: 0.1rem;
  display: inline-grid; place-items: center; flex: none;
  width: 1.4rem; height: 1.4rem; border-radius: 50%;
  font-size: 0.75rem; font-weight: 600;
  border: 1px solid currentColor; opacity: 0.6;
}
.st--active .st__no { color: #FFFFFF; background: var(--c-text); border-color: var(--c-text); opacity: 1; }
.st__text { flex: 1; min-width: 0; display: grid; }
/* Gewaehlter Wert unter dem Titel: so passt auch "23.10.–25.10. · 3 Tage". */
.st__val {
  font-size: 0.8125rem; font-weight: 400; color: var(--c-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.st__check { flex: none; color: var(--c-gold); }

/* Weiches Auf- und Zuklappen ueber die Zeilenhoehe des Grids. */
.st__body {
  display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows var(--d-base) var(--e-out);
}
.st--active .st__body { grid-template-rows: 1fr; }
/* Etwas Luft, damit overflow den Fokusrahmen der Optionen nicht abschneidet. */
.st__inner { min-height: 0; overflow: hidden; }
.st--active .st__inner { padding: 3px 3px var(--s-4); margin: 0 -3px; }
@media (prefers-reduced-motion: reduce) { .st__body { transition: none; } }
</style>
