<script setup lang="ts">
// Tage sperren, an denen ein Geraet nicht verfuegbar ist, ohne dass es
// eine Buchung ueber die Seite gibt (Kleinanzeigen, privat, Wartung).
// Der Buchungskalender zeigt diese Tage dann als belegt.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Sperrtage', robots: 'noindex, nofollow' })

interface Sperre { id: number, geraet: 'fotobox' | 'soundbox', anzahl: number, von: string, bis: string, grund: string | null }
const { api } = useAdmin()
const { data, refresh } = await useFetch<Sperre[]>('/api/admin/sperren', { default: () => [] })

const heute = ref('')
onMounted(() => { heute.value = new Date().toLocaleDateString('sv-SE') })
const form = reactive({ geraet: 'fotobox' as 'fotobox' | 'soundbox', anzahl: 1, von: '', bis: '', grund: '' })
watch(() => form.geraet, (g) => { if (g === 'fotobox') form.anzahl = 1 })
watch(() => form.von, (v) => { if (!form.bis || form.bis < v) form.bis = v })
const fehler = ref('')
const laeuft = ref(false)

async function sperren() {
  fehler.value = ''
  laeuft.value = true
  try {
    await api('/api/admin/sperren', { method: 'POST', body: { ...form, grund: form.grund || undefined } })
    Object.assign(form, { von: '', bis: '', grund: '' })
    await refresh()
  }
  catch (err) { fehler.value = (err as Error).message }
  finally { laeuft.value = false }
}

async function aufheben(s: Sperre) {
  if (!confirm('Sperre aufheben? Die Tage sind dann wieder buchbar.')) return
  try {
    await api(`/api/admin/sperren/${s.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err) { fehler.value = (err as Error).message }
}

const name = (s: Pick<Sperre, 'geraet' | 'anzahl'>) => s.geraet === 'fotobox' ? 'Fotobox' : s.anzahl > 1 ? `${s.anzahl} Soundboxen` : 'Soundbox'
</script>

<template>
  <div class="sp">
    <h1 class="display sp__h">Sperrtage</h1>
    <p class="muted sp__intro">Hier trägst du Tage ein, an denen ein Gerät woanders vermietet ist oder nicht verfügbar ist. Im Kalender auf der Website sind sie dann belegt.</p>

    <form class="sp__form" @submit.prevent="sperren">
      <UiField id="sp-geraet" label="Gerät">
        <select id="sp-geraet" v-model="form.geraet" class="control">
          <option value="fotobox">Fotobox</option>
          <option value="soundbox">Soundbox</option>
        </select>
      </UiField>
      <UiField v-if="form.geraet === 'soundbox'" id="sp-anzahl" label="Anzahl">
        <select id="sp-anzahl" v-model.number="form.anzahl" class="control">
          <option :value="1">1 Soundbox</option>
          <option :value="2">2 Soundboxen</option>
        </select>
      </UiField>
      <UiField id="sp-von" label="Von">
        <input id="sp-von" v-model="form.von" class="control" type="date" :min="heute" required>
      </UiField>
      <UiField id="sp-bis" label="Bis (einschließlich)">
        <input id="sp-bis" v-model="form.bis" class="control" type="date" :min="form.von || heute" required>
      </UiField>
      <UiField id="sp-grund" label="Grund" optional class="sp__grund">
        <input id="sp-grund" v-model="form.grund" class="control" maxlength="200" placeholder="z. B. Kleinanzeigen, Wartung">
      </UiField>
      <UiHinweis v-if="fehler" ton="fehler" class="sp__fehler">{{ fehler }}</UiHinweis>
      <UiButton variant="solid" class="sp__btn" :disabled="laeuft || !form.von || !form.bis">Tage sperren</UiButton>
    </form>

    <h2 class="label sp__h2">Kommende Sperren</h2>
    <p v-if="!data.length" class="muted">Keine Sperren eingetragen.</p>
    <ul class="sp__liste">
      <li v-for="s in data" :key="s.id" class="sp__item">
        <div>
          <p><strong>{{ name(s) }}</strong></p>
          <p>{{ s.von === s.bis ? adminDatum(s.von) : `${adminDatum(s.von)} bis ${adminDatum(s.bis)}` }}</p>
          <p v-if="s.grund" class="muted">{{ s.grund }}</p>
        </div>
        <button type="button" class="sp__weg" @click="aufheben(s)">Aufheben</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sp { display: grid; gap: var(--s-5); max-width: 48rem; }
.sp__h { font-size: var(--t-h2); }
.sp__intro { font-size: var(--t-small); max-width: 60ch; }
.sp__form { display: grid; gap: var(--s-4); padding: var(--s-5); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); }
@media (min-width: 640px) {
  .sp__form { grid-template-columns: 1fr 1fr; }
  .sp__grund, .sp__btn, }
.sp__btn { justify-self: start; }
.sp__h2 { margin-top: var(--s-4); }
.sp__liste { list-style: none; padding: 0; display: grid; gap: var(--s-3); }
.sp__item {
  display: flex; align-items: center; justify-content: space-between; gap: var(--s-4);
  padding: var(--s-4) var(--s-5); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
  font-size: var(--t-small);
}
.sp__weg { color: var(--c-danger); font-weight: 600; font-size: var(--t-small); }
</style>
