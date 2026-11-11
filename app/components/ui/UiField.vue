<script setup lang="ts">
// Beschriftung ueber dem Feld statt Platzhalter als Beschriftung: der
// Platzhalter verschwindet beim Tippen, die Beschriftung bleibt.
// Das Feld selbst kommt per Slot und verweist mit
// aria-describedby="<id>-fehler" auf die Fehlermeldung.
defineProps<{ id: string, label: string, error?: string, optional?: boolean }>()
</script>

<template>
  <div class="field">
    <label :for="id" class="label field__label">
      {{ label }}<span v-if="optional" class="field__opt"> (optional)</span>
    </label>
    <slot />
    <UiFehler v-if="error" :id="`${id}-fehler`">{{ error }}</UiFehler>
  </div>
</template>

<style scoped>
.field { display: grid; gap: var(--s-2); align-content: start; }
.field__label { color: var(--c-text); }
.field__opt { color: var(--c-text-muted); text-transform: none; letter-spacing: 0; font-weight: 400; }
</style>
