<script setup lang="ts">
import { BEZUEGE, type Bezug } from '~~/shared/bewertungen'

// Louis kommt ueber den Link aus der Benachrichtigungsmail hierher und
// schaltet die Bewertung mit einem Klick frei (oder loescht sie).
// Der Link selbst aendert nichts, erst der Knopf (siehe freigabe.post.ts).
useSeoMeta({ title: 'Bewertung freigeben', robots: 'noindex, nofollow' })

const route = useRoute()
const id = String(route.query.id ?? '')
const t = String(route.query.t ?? '')

const { data: b, error } = await useFetch<{
  name: string, sterne: number, text: string, bezug: Bezug | null, erstellt_am: string, freigegeben: boolean, bilder?: string[]
}>('/api/bewertungen/freigabe', { query: { id, t } })

const status = ref<'idle' | 'sending' | 'failed'>('idle')
const geloescht = ref(false)

async function aktion(was: 'freigeben' | 'verbergen' | 'loeschen') {
  if (was === 'loeschen' && !confirm('Bewertung endgültig löschen?')) return
  status.value = 'sending'
  try {
    await $fetch('/api/bewertungen/freigabe', { method: 'POST', body: { id, t, aktion: was } })
    if (was === 'loeschen') geloescht.value = true
    else if (b.value) b.value.freigegeben = was === 'freigeben'
    status.value = 'idle'
  }
  catch {
    status.value = 'failed'
  }
}
</script>

<template>
  <div class="section shell fg">
    <h1 class="display fg__h">Bewertung freigeben</h1>

    <p v-if="error" class="muted">Dieser Link ist ungültig oder die Bewertung wurde schon gelöscht.</p>
    <p v-else-if="geloescht" class="muted">Die Bewertung ist gelöscht.</p>

    <div v-else-if="b" class="fg__card">
      <p class="label fg__bezug">{{ b.bezug ? BEZUEGE[b.bezug] : 'Allgemein' }}</p>
      <ReviewStars :value="b.sterne" :size="18" />
      <p class="fg__text">{{ b.text }}</p>
      <div v-if="b.bilder?.length" class="fg__fotos">
        <a v-for="(src, i) in b.bilder" :key="src" :href="src" target="_blank" rel="noopener">
          <img :src="src" :alt="`Foto ${i + 1}`">
        </a>
      </div>
      <p class="muted"><strong>{{ b.name }}</strong> · {{ new Date(b.erstellt_am).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) }}</p>

      <p class="fg__state" :class="{ 'is-on': b.freigegeben }">
        <UiIcon :name="b.freigegeben ? 'check' : 'info'" :size="16" />
        {{ b.freigegeben ? 'Freigeschaltet, steht auf der Seite.' : 'Noch nicht freigeschaltet, auf der Seite unsichtbar.' }}
      </p>

      <div class="fg__btns">
        <UiButton v-if="!b.freigegeben" variant="solid" :disabled="status === 'sending'" @click="aktion('freigeben')">Freischalten</UiButton>
        <UiButton v-else variant="outline" :disabled="status === 'sending'" @click="aktion('verbergen')">Wieder verbergen</UiButton>
        <button type="button" class="fg__del" :disabled="status === 'sending'" @click="aktion('loeschen')">
          <UiIcon name="trash" :size="16" /> Löschen
        </button>
      </div>
      <UiHinweis v-if="status === 'failed'" ton="fehler">Das hat nicht geklappt. Bitte später noch einmal versuchen.</UiHinweis>
    </div>
  </div>
</template>

<style scoped>
.fg { max-width: 40rem; display: grid; gap: var(--s-6); }
.fg__h { font-size: var(--t-h2); }
.fg__fotos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-2); }
.fg__fotos img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--r-sm); display: block; }
.fg__card { display: grid; gap: var(--s-3); padding: var(--s-6); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); }
.fg__bezug { color: var(--c-gold); }
.fg__text { line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }
.fg__state { display: flex; align-items: center; gap: var(--s-2); margin-top: var(--s-3); font-size: var(--t-small); color: var(--c-text-muted); }
.fg__state.is-on { color: var(--c-success); }
.fg__btns { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-4); margin-top: var(--s-2); }
.fg__del { display: inline-flex; align-items: center; gap: var(--s-2); color: var(--c-danger); font-weight: 600; font-size: var(--t-small); }
</style>
