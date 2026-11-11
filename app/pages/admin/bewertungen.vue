<script setup lang="ts">
import type { Bewertung } from '~~/shared/bewertungen'

// Alle Bewertungen an einer Stelle: wartende oben, mit einem Tipp
// freischalten, verbergen oder loeschen. Der Link aus der Mail geht weiter.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Bewertungen', robots: 'noindex, nofollow' })

type AdminBewertung = Bewertung & { freigegeben: boolean }
const { api } = useAdmin()
const { data, refresh } = await useFetch<AdminBewertung[]>('/api/admin/bewertungen', { default: () => [] })
const filter = ref<'wartend' | 'freigegeben'>('wartend')
const liste = computed(() => data.value.filter(b => (filter.value === 'wartend') !== b.freigegeben))
const wartend = computed(() => data.value.filter(b => !b.freigegeben).length)
const fehler = ref('')

async function aktion(b: AdminBewertung, was: 'freigeben' | 'verbergen' | 'loeschen') {
  if (was === 'loeschen' && !confirm(`Bewertung von ${b.name} endgültig löschen?`)) return
  fehler.value = ''
  try {
    await api(`/api/admin/bewertungen/${b.id}`, { method: 'PATCH', body: { aktion: was } })
    await refresh()
  }
  catch (err) { fehler.value = (err as Error).message }
}
</script>

<template>
  <div class="bw">
    <div class="bw__head">
      <h1 class="display bw__h">Bewertungen</h1>
      <div class="bw__seg" role="tablist" aria-label="Filter">
        <button type="button" role="tab" class="bw__seg-b" :aria-selected="filter === 'wartend'" @click="filter = 'wartend'">
          Wartend<span v-if="wartend" class="bw__zahl">{{ wartend }}</span>
        </button>
        <button type="button" role="tab" class="bw__seg-b" :aria-selected="filter === 'freigegeben'" @click="filter = 'freigegeben'">
          Freigegeben
        </button>
      </div>
    </div>
    <UiHinweis v-if="fehler" ton="fehler">{{ fehler }}</UiHinweis>
    <p v-if="!liste.length" class="muted bw__leer">
      {{ filter === 'wartend' ? 'Keine neuen Bewertungen. Alles erledigt.' : 'Noch nichts freigegeben.' }}
    </p>
    <div class="bw__liste">
      <div v-for="b in liste" :key="b.id" class="bw__karte">
        <ReviewItem :b="b" />
        <div class="bw__btns">
          <UiButton v-if="!b.freigegeben" variant="solid" size="sm" @click="aktion(b, 'freigeben')">Freischalten</UiButton>
          <UiButton v-else variant="light" size="sm" @click="aktion(b, 'verbergen')">Verbergen</UiButton>
          <button type="button" class="bw__weg" @click="aktion(b, 'loeschen')">Löschen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bw { display: grid; gap: var(--s-5); }
.bw__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-4); }
.bw__h { font-size: var(--t-h2); }
.bw__seg { display: inline-flex; padding: 0.25rem; background: var(--c-paper-pure); border: var(--border-hair); border-radius: 99px; }
.bw__seg-b { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border-radius: 99px; font-size: var(--t-small); color: var(--c-text-muted); }
.bw__seg-b[aria-selected='true'] { background: var(--c-gold); color: var(--c-on-gold); }
.bw__zahl { min-width: 1.3rem; padding: 0 0.35rem; border-radius: 99px; background: var(--c-danger); color: #FFFFFF; font-size: 0.7rem; text-align: center; }
.bw__leer { padding: var(--s-7) 0; text-align: center; }
.bw__liste { display: grid; gap: var(--s-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr)); }
.bw__karte { display: grid; gap: var(--s-4); align-content: space-between; padding: var(--s-5); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); }
.bw__btns { display: flex; align-items: center; gap: var(--s-4); }
.bw__weg { margin-left: auto; color: var(--c-danger); font-weight: 600; font-size: var(--t-small); }
</style>
