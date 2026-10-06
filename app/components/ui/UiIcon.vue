<script setup lang="ts">
// Ein Strich-Icon-Satz fuer die ganze Seite: 24er Raster, 1.6er Linie,
// runde Enden. Gleiche Formsprache wie die Plaketten auf der Linkseite.
export type IconName =
  | 'phone' | 'mail' | 'pin' | 'instagram' | 'tiktok'
  | 'calendar' | 'check' | 'arrow' | 'alert'

const { name, size = 20 } = defineProps<{ name: IconName, size?: number }>()
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true" class="icon"
  >
    <template v-if="name === 'phone'">
      <path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
    </template>
    <template v-else-if="name === 'mail'">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </template>
    <template v-else-if="name === 'pin'">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </template>
    <template v-else-if="name === 'instagram'">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'tiktok'">
      <path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46" />
      <path d="M14 4c.4 2.2 2 3.7 4.5 3.9" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </template>
    <template v-else-if="name === 'alert'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </template>
    <template v-else>
      <path d="M5 12h13M12 6l6 6-6 6" />
    </template>
  </svg>
</template>

<style scoped>
.icon { flex: none; }
</style>
