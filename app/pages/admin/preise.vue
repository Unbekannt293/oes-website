<script setup lang="ts">
import { aktionLaeuft, heuteBerlin, PREISFELD, PREISFELDER, type PreisFeld, type PreisRegel } from '~~/shared/preise'
import { formatPrice } from '~~/shared/pricing'

// Alle Preise an einer Stelle: dauerhaft aendern (oder auf Standard
// zuruecksetzen) und Aktionspreise fuer einen Zeitraum anlegen.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Preise', robots: 'noindex, nofollow' })

const { api } = useAdmin()
const { data: regeln, refresh } = await useFetch<PreisRegel[]>('/api/admin/preise', { default: () => [] })
const heute = heuteBerlin()
const fehler = ref('')
const laeuft = ref(false)

const gruppen = computed(() => {
  const m = new Map<string, PreisFeld[]>()
  for (const f of PREISFELDER) m.set(f.gruppe, [...(m.get(f.gruppe) ?? []), f])
  return [...m]
})

// Anzeige und Eingabe: Euro mit Komma, Kilometer als ganze Zahl.
const zeigen = (f: PreisFeld, w: number) => f.einheit === 'km' ? `${w} km` : formatPrice(w)
const alsText = (f: PreisFeld, w: number) => f.einheit === 'km' ? String(w) : (w / 100).toFixed(2).replace('.', ',')
function lesen(f: PreisFeld, text: string): number | null {
  const n = Number(text.trim().replace(/\s|€|km/g, '').replace(',', '.'))
  if (!text.trim() || !Number.isFinite(n) || n < 0) return null
  return f.einheit === 'km' ? Math.round(n) : Math.round(n * 100)
}

const dauerhaft = (f: PreisFeld) => regeln.value.find(r => r.schluessel === f.schluessel && !r.gueltig_von)
const laufendeAktion = (f: PreisFeld) => regeln.value.filter(r => r.schluessel === f.schluessel && aktionLaeuft(r, heute)).at(-1)

// Eingabefelder: vorbelegt mit dem dauerhaften Wert (geaendert oder Standard).
const eingaben = reactive<Record<string, string>>({})
watch(regeln, () => {
  for (const f of PREISFELDER) eingaben[f.schluessel] = alsText(f, dauerhaft(f)?.wert ?? f.standard)
}, { immediate: true })
const geaendert = (f: PreisFeld) => lesen(f, eingaben[f.schluessel] ?? '') !== (dauerhaft(f)?.wert ?? f.standard)

async function aufruf(fn: () => Promise<unknown>) {
  fehler.value = ''
  laeuft.value = true
  try { await fn(); await refresh() }
  catch (err) { fehler.value = (err as Error).message }
  finally { laeuft.value = false }
}

function speichern(f: PreisFeld) {
  const wert = lesen(f, eingaben[f.schluessel] ?? '')
  if (wert === null) { fehler.value = `${f.label}: bitte eine Zahl eingeben`; return }
  // Gleich dem Standard: Abweichung entfernen statt einen doppelten Wert speichern.
  return aufruf(() => api('/api/admin/preise', { method: 'PUT', body: { schluessel: f.schluessel, wert: wert === f.standard ? null : wert } }))
}
function zuruecksetzen(f: PreisFeld) {
  return aufruf(() => api('/api/admin/preise', { method: 'PUT', body: { schluessel: f.schluessel, wert: null } }))
}

// Aktionen
const aktion = reactive({ schluessel: PREISFELDER[0]!.schluessel, wert: '', von: '', bis: '' })
watch(() => aktion.von, (v) => { if (!aktion.bis || aktion.bis < v) aktion.bis = v })
const aktionen = computed(() => regeln.value.filter(r => r.gueltig_von).sort((a, b) => a.gueltig_von!.localeCompare(b.gueltig_von!)))
const aktionStatus = (r: PreisRegel) => aktionLaeuft(r, heute) ? 'laeuft' : r.gueltig_bis! < heute ? 'vorbei' : 'geplant'
const STATUS_TEXT = { laeuft: 'läuft', vorbei: 'vorbei', geplant: 'geplant' } as const

function aktionAnlegen() {
  const f = PREISFELD.get(aktion.schluessel)!
  const wert = lesen(f, aktion.wert)
  if (wert === null) { fehler.value = 'Aktionspreis: bitte eine Zahl eingeben'; return }
  return aufruf(async () => {
    await api('/api/admin/preise/aktion', { method: 'POST', body: { schluessel: f.schluessel, wert, von: aktion.von, bis: aktion.bis } })
    Object.assign(aktion, { wert: '', von: '', bis: '' })
  })
}
function entfernen(r: PreisRegel) {
  if (!confirm('Aktion löschen?')) return
  return aufruf(() => api(`/api/admin/preise/${r.id}`, { method: 'DELETE' }))
}
</script>

<template>
  <div class="pr">
    <h1 class="display pr__h">Preise</h1>
    <p class="muted pr__intro">
      Neue Preise gelten sofort für neue Buchungen. Bestehende Buchungen behalten ihren Preis.
      Komplettpakete sind Festpreise für Paket und Soundboxen zusammen.
    </p>
    <UiHinweis v-if="fehler" ton="fehler" class="pr__fehler">{{ fehler }}</UiHinweis>

    <!-- ============ Aktionen ============ -->
    <section class="pr__box" aria-labelledby="ak-h">
      <h2 id="ak-h" class="label pr__gruppe">Aktionspreise mit Zeitraum</h2>
      <p class="muted pr__klein">Gilt für Buchungen, die zwischen Von und Bis eingehen. Danach gilt wieder der normale Preis.</p>
      <form class="pr__ak-form" @submit.prevent="aktionAnlegen">
        <UiField id="ak-preis" label="Preis" class="pr__ak-preis">
          <select id="ak-preis" v-model="aktion.schluessel" class="control">
            <optgroup v-for="[g, felder] in gruppen" :key="g" :label="g">
              <option v-for="f in felder" :key="f.schluessel" :value="f.schluessel">{{ f.label }}</option>
            </optgroup>
          </select>
        </UiField>
        <UiField id="ak-wert" :label="PREISFELD.get(aktion.schluessel)!.einheit === 'km' ? 'Aktion (km)' : 'Aktionspreis (€)'">
          <input id="ak-wert" v-model="aktion.wert" class="control" inputmode="decimal" required>
        </UiField>
        <UiField id="ak-von" label="Von">
          <input id="ak-von" v-model="aktion.von" class="control" type="date" :min="heute" required>
        </UiField>
        <UiField id="ak-bis" label="Bis (einschließlich)">
          <input id="ak-bis" v-model="aktion.bis" class="control" type="date" :min="aktion.von || heute" required>
        </UiField>
        <UiButton variant="solid" size="sm" class="pr__ak-btn" :disabled="laeuft">Aktion anlegen</UiButton>
      </form>
      <ul v-if="aktionen.length" class="pr__ak-liste">
        <li v-for="r in aktionen" :key="r.id" :class="`is-${aktionStatus(r)}`">
          <div>
            <strong>{{ PREISFELD.get(r.schluessel)?.label ?? r.schluessel }}</strong>
            <span class="muted"> · {{ PREISFELD.get(r.schluessel)?.gruppe }}</span><br>
            {{ PREISFELD.get(r.schluessel) ? zeigen(PREISFELD.get(r.schluessel)!, r.wert) : r.wert }},
            {{ adminDatum(r.gueltig_von!) }} bis {{ adminDatum(r.gueltig_bis!) }}
          </div>
          <span class="pr__ak-st">{{ STATUS_TEXT[aktionStatus(r)] }}</span>
          <button type="button" class="pr__weg" :disabled="laeuft" @click="entfernen(r)">Löschen</button>
        </li>
      </ul>
    </section>

    <!-- ============ Dauerhafte Preise ============ -->
    <section v-for="[g, felder] in gruppen" :key="g" class="pr__box" :aria-label="g">
      <h2 class="label pr__gruppe">{{ g }}</h2>
      <div v-for="f in felder" :key="f.schluessel" class="pr__zeile">
        <label :for="`p-${f.schluessel}`" class="pr__label">
          {{ f.label }}
          <small v-if="dauerhaft(f)" class="pr__std">geändert, Standard {{ zeigen(f, f.standard) }}</small>
          <small v-if="laufendeAktion(f)" class="pr__aktion">Aktion läuft: {{ zeigen(f, laufendeAktion(f)!.wert) }} bis {{ adminDatum(laufendeAktion(f)!.gueltig_bis!) }}</small>
        </label>
        <div class="pr__eingabe">
          <input :id="`p-${f.schluessel}`" v-model="eingaben[f.schluessel]" class="control" inputmode="decimal" @keydown.enter.prevent="speichern(f)">
          <span class="pr__einheit">{{ f.einheit === 'km' ? 'km' : '€' }}</span>
        </div>
        <div class="pr__btns">
          <UiButton v-if="geaendert(f)" variant="solid" size="sm" :disabled="laeuft" @click="speichern(f)">Speichern</UiButton>
          <button v-else-if="dauerhaft(f)" type="button" class="pr__reset" :disabled="laeuft" @click="zuruecksetzen(f)">Standard</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pr { display: grid; gap: var(--s-5); max-width: 52rem; }
.pr__h { font-size: var(--t-h2); }
.pr__intro, .pr__klein { font-size: var(--t-small); max-width: 62ch; }
.pr__fehler { position: sticky; top: var(--s-3); z-index: 2; }
.pr__box { display: grid; gap: var(--s-3); padding: var(--s-5); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); }
.pr__gruppe { color: var(--c-gold); margin-bottom: var(--s-1); }

.pr__zeile {
  display: grid; grid-template-columns: minmax(0, 1fr) 8.5rem 6.5rem; gap: var(--s-3); align-items: center;
  padding-block: var(--s-2); border-top: var(--border-hair);
}
.pr__zeile:first-of-type { border-top: 0; }
.pr__label { display: grid; gap: 0.1rem; font-size: var(--t-small); }
.pr__std { color: var(--c-text-muted); }
.pr__aktion { color: var(--c-success); font-weight: 600; }
.pr__eingabe { position: relative; }
.pr__eingabe .control { padding: 0.5rem 2rem 0.5rem 0.75rem; text-align: right; font-variant-numeric: tabular-nums; }
.pr__einheit { position: absolute; right: 0.7rem; top: 50%; translate: 0 -50%; color: var(--c-text-muted); font-size: var(--t-small); pointer-events: none; }
.pr__btns { display: flex; justify-content: flex-end; }
.pr__reset { font-size: var(--t-small); color: var(--c-text-muted); text-decoration: underline; text-underline-offset: 2px; }
.pr__reset:hover { color: var(--c-gold); }
@media (max-width: 520px) {
  .pr__zeile { grid-template-columns: minmax(0, 1fr) 7.5rem; }
  .pr__btns { grid-column: 1 / -1; justify-content: flex-start; }
  .pr__btns:empty { display: none; }
}

.pr__ak-form { display: grid; gap: var(--s-3); padding: var(--s-4); background: var(--c-paper); border-radius: var(--r-md); }
@media (min-width: 640px) {
  .pr__ak-form { grid-template-columns: 1fr 1fr; }
  .pr__ak-preis, .pr__ak-btn { grid-column: 1 / -1; }
}
.pr__ak-btn { justify-self: start; }
.pr__ak-liste { list-style: none; padding: 0; display: grid; gap: var(--s-2); }
.pr__ak-liste li {
  display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--s-4); align-items: center;
  padding: var(--s-3) var(--s-4); border: var(--border-hair); border-radius: var(--r-md); font-size: var(--t-small);
}
.pr__ak-liste li.is-vorbei { opacity: 0.55; }
.pr__ak-st { padding: 0.15rem 0.55rem; border-radius: 99px; background: var(--c-paper); font-size: var(--t-2xs); font-weight: 600; }
.is-laeuft .pr__ak-st { background: rgb(46 125 91 / 0.12); color: var(--c-success); }
.pr__weg { color: var(--c-danger); font-weight: 600; font-size: var(--t-small); }
</style>
