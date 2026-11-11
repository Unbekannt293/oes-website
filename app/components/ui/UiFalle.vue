<script setup lang="ts">
// Honeypot gegen Bots: ein Feld, das Menschen nicht sehen und per Tab nicht
// erreichen. Fuellt es jemand aus, antwortet der Server "ok" und speichert
// nichts (server/utils/bremse.ts). Fuer jedes oeffentliche Formular.
const wert = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="fa" aria-hidden="true">
    <label :for="id">Website</label>
    <input :id="id" v-model="wert" type="text" name="website" tabindex="-1" autocomplete="off">
  </div>
</template>

<style scoped>
.fa { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
</style>
