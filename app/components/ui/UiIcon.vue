<script setup lang="ts">
// Ein Strich-Icon-Satz fuer die ganze Seite: 24er Raster, 1.6er Linie,
// runde Enden. Gleiche Formsprache wie die Plaketten auf der Linkseite.
export type IconName =
  | 'phone' | 'mail' | 'pin' | 'instagram' | 'tiktok'
  | 'calendar' | 'check' | 'arrow' | 'alert'
  | 'cart' | 'star' | 'gem' | 'crown' | 'trophy' | 'puzzle' | 'chat' | 'info' | 'close' | 'trash' | 'minus'

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
    <template v-else-if="name === 'cart'">
      <path d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </template>
    <template v-else-if="name === 'star'">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />
    </template>
    <template v-else-if="name === 'gem'">
      <path d="M6.5 4h11l3.5 5-9 11-9-11z" />
      <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
    </template>
    <template v-else-if="name === 'crown'">
      <path d="M3.5 8l4.5 4 4-6.5 4 6.5 4.5-4-2 10h-13z" />
      <path d="M5.5 20h13" />
    </template>
    <template v-else-if="name === 'trophy'">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4M12 14v3M8.5 20h7M9.5 17h5v3h-5z" />
    </template>
    <template v-else-if="name === 'puzzle'">
      <path d="M9 4h3.2a2 2 0 1 1 3.6 0H19v4.2a2 2 0 1 0 0 3.6V16h-3.2a2 2 0 1 1-3.6 0H9v-3.2a2 2 0 1 1 0-3.6z" />
      <path d="M5 9v11h11" />
    </template>
    <template v-else-if="name === 'chat'">
      <path d="M4 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3.5V15H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L16 18h-4" />
    </template>
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.01" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6 6 18" />
    </template>
    <template v-else-if="name === 'minus'">
      <path d="M6 12h12" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12.2a1 1 0 0 0 1 .8h7.2a1 1 0 0 0 1-.8L17.5 7M10 11v5.5M14 11v5.5" />
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
