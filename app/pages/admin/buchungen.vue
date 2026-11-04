<script setup lang="ts">
import type { AdminBuchungDaten } from '~~/shared/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Buchungen', robots: 'noindex, nofollow' })

const ansicht = ref<'kommend' | 'vergangen' | 'storniert'>('kommend')
const { data, status, error, refresh } = await useFetch<AdminBuchungDaten[]>('/api/admin/buchungen', {
  query: { ansicht }, default: () => [],
})
const neu = computed(() => data.value.filter(b => b.status === 'angefragt').length)
</script>

<template>
  <div class="ap">
    <div class="ap__head">
      <div class="ap__titel">
        <h1 class="display ap__h">Buchungen</h1>
        <!-- Sicherung fuer Louis: alle Buchungen als Tabelle (auch was nur hier steht). -->
        <a href="/api/admin/buchungen/export" class="ap__csv" download>Alle als Tabelle (CSV) herunterladen</a>
      </div>
      <div class="ap__seg" role="tablist" aria-label="Ansicht">
        <button
          v-for="a in (['kommend', 'vergangen', 'storniert'] as const)" :key="a" type="button" role="tab"
          :aria-selected="ansicht === a" class="ap__seg-b" @click="ansicht = a"
        >
          {{ a === 'kommend' ? 'Kommend' : a === 'vergangen' ? 'Vergangen' : 'Storniert' }}
        </button>
      </div>
    </div>

    <p v-if="ansicht === 'kommend' && neu" class="ap__hint">
      {{ neu === 1 ? '1 neue Buchung wartet' : `${neu} neue Buchungen warten` }} auf deine Bestätigung.
    </p>
    <p v-if="error" class="ap__fehler" role="alert">Buchungen konnten nicht geladen werden. <button type="button" @click="refresh()">Neu laden</button></p>
    <p v-else-if="status === 'pending'" class="muted">Lädt …</p>
    <p v-else-if="!data.length" class="ap__leer muted">Hier ist gerade nichts.</p>

    <div class="ap__liste">
      <AdminBuchung v-for="(b, i) in data" :key="b.id" v-model="data[i]!" />
    </div>
  </div>
</template>

<style scoped>
.ap { display: grid; gap: var(--s-5); }
.ap__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-4); }
.ap__h { font-size: var(--t-h2); }
.ap__titel { display: grid; gap: var(--s-1); }
.ap__csv { font-size: var(--t-small); font-weight: 600; color: var(--c-gold); text-decoration: underline; text-underline-offset: 2px; }
.ap__seg { display: inline-flex; padding: 0.25rem; background: var(--c-paper-pure); border: var(--border-hair); border-radius: 99px; }
.ap__seg-b { padding: 0.45rem 1rem; border-radius: 99px; font-size: var(--t-small); color: var(--c-text-muted); }
.ap__seg-b[aria-selected='true'] { background: var(--c-gold); color: #FFFFFF; }
.ap__hint { padding: var(--s-3) var(--s-4); background: rgb(195 139 55 / 0.12); border-radius: var(--r-md); font-size: var(--t-small); }
.ap__fehler { color: var(--c-danger); }
.ap__fehler button { text-decoration: underline; }
.ap__leer { padding: var(--s-7) 0; text-align: center; }
.ap__liste { display: grid; gap: var(--s-4); }
</style>
