<script setup lang="ts">
// Zum Aufklappen (Lukas, 11.11.2026): Produktbeschreibung, Textfassung der
// Rechtstexte. Oben und unten eine Haarlinie, links der Titel, rechts ein
// Pfeil, der sich beim Oeffnen dreht. Natives <details>: funktioniert ohne
// JavaScript und ist fuer Bildschirmleser verstaendlich.
//  - Standard: kleiner Versal-Titel (Nebensache, z. B. Textfassung)
//  - gross: Titel in der Ueberschriften-Schrift, Zeile darunter, Linien
//    oben und unten gold (Inhalt, den man sehen soll, z. B. Produktbeschreibung)
defineProps<{ titel: string, untertitel?: string, gross?: boolean, offen?: boolean }>()
</script>

<template>
  <details class="ak" :class="{ 'ak--gross': gross }" :open="offen">
    <summary class="ak__kopf">
      <span class="ak__text">
        <span class="ak__titel" :class="{ display: gross }">{{ titel }}</span>
        <span v-if="untertitel" class="ak__unter">{{ untertitel }}</span>
      </span>
      <span class="ak__pfeil" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </summary>
    <div class="ak__inhalt"><slot /></div>
  </details>
</template>

<style scoped>
.ak { border-top: 1px solid var(--c-gold-hair); border-bottom: 1px solid var(--c-gold-hair); }
.ak__kopf {
  display: flex; align-items: center; justify-content: space-between; gap: var(--s-4);
  padding: var(--s-4) 0; cursor: pointer; list-style: none;
}
.ak__kopf::-webkit-details-marker { display: none; }
.ak__kopf:focus-visible { outline: 2px solid var(--c-gold); outline-offset: 2px; }
.ak__text { display: grid; gap: var(--s-1); }
.ak__titel {
  font-size: var(--t-label); font-weight: 600; letter-spacing: var(--tr-label);
  text-transform: uppercase; color: var(--c-text);
  transition: color var(--d-fast) var(--e-out);
}
.ak__unter { font-size: var(--t-xs); color: var(--c-text-muted); }
.ak__kopf:hover .ak__titel { color: var(--c-gold); }
.ak__pfeil { flex: none; display: grid; place-items: center; color: var(--c-gold); transition: transform var(--d-base) var(--e-out), background var(--d-fast) var(--e-out), color var(--d-fast) var(--e-out); }
.ak[open] .ak__pfeil { transform: rotate(180deg); }
.ak__inhalt { padding: var(--s-2) 0 var(--s-6); }

/* Gross: wie eine Abschnittsueberschrift, beide Linien gold. */
.ak--gross { border-top-color: var(--c-gold); border-bottom-color: var(--c-gold); }
.ak--gross .ak__kopf { padding: var(--s-5) 0; }
.ak--gross .ak__titel { font-size: var(--t-h3); font-weight: 500; letter-spacing: 0; text-transform: none; }
.ak--gross .ak__pfeil svg { width: 22px; height: 22px; }
</style>
