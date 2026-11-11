<script setup lang="ts">
// Datei-Upload der Seite (STYLEGUIDE.md "Upload"): gewaehlte Dateien als
// quadratische Kacheln mit X zum Entfernen, daneben eine gestrichelte
// Kachel mit Kamera zum Hinzufuegen. Fuer Bewertungsfotos und das Logo.
// Das Einlesen (verkleinern, pruefen) macht die Funktion "lesen" des
// Aufrufers; sie wirft mit einer verstaendlichen Meldung, wenn etwas nicht passt.
interface UploadDatei { src: string, name?: string }

const dateien = defineModel<UploadDatei[]>({ required: true })
const {
  lesen, max = 1, label = 'Datei', accept = 'image/*', schachbrett = false,
} = defineProps<{
  lesen: (datei: File) => Promise<string>
  max?: number
  /** Text in der Hinzufuegen-Kachel, z. B. "Foto" oder "Logo". */
  label?: string
  accept?: string
  /** Kariert hinterlegt: zeigt, ob ein Logo transparent ist. */
  schachbrett?: boolean
}>()

const input = ref<HTMLInputElement | null>(null)
const laeuft = ref(false)
const fehler = ref('')
const istPdf = (src: string) => src.startsWith('data:application/pdf')

async function waehlen(e: Event) {
  const el = e.target as HTMLInputElement
  const neu = [...(el.files ?? [])].slice(0, max - dateien.value.length)
  el.value = '' // dieselbe Datei spaeter noch einmal waehlbar
  fehler.value = ''
  laeuft.value = true
  const fertig: UploadDatei[] = []
  for (const d of neu) {
    try { fertig.push({ src: await lesen(d), name: d.name }) }
    catch (err) { fehler.value = (err as Error).message || 'Die Datei ließ sich nicht verarbeiten.' }
  }
  dateien.value = [...dateien.value, ...fertig]
  laeuft.value = false
}

function entfernen(i: number) {
  dateien.value = dateien.value.filter((_, j) => j !== i)
}
</script>

<template>
  <div class="up">
    <ul class="up__liste">
      <li v-for="(d, i) in dateien" :key="i" class="up__kachel" :class="{ 'up__kachel--schach': schachbrett }">
        <span v-if="istPdf(d.src)" class="up__pdf">PDF</span>
        <img v-else :src="d.src" :alt="d.name ?? `${label} ${i + 1}`">
        <button type="button" class="up__x" :aria-label="`${label} ${i + 1} entfernen`" @click="entfernen(i)">
          <UiIcon name="close" :size="14" />
        </button>
      </li>
      <li v-if="dateien.length < max">
        <button type="button" class="up__neu" :disabled="laeuft" @click="input?.click()">
          <template v-if="laeuft">…</template>
          <template v-else><UiIcon name="camera" :size="22" /><span>{{ label }}</span></template>
        </button>
      </li>
    </ul>
    <p v-if="max === 1 && dateien[0]?.name" class="notiz up__name">{{ dateien[0].name }}</p>
    <input ref="input" type="file" :accept="accept" :multiple="max > 1" class="visually-hidden" tabindex="-1" @change="waehlen">
    <UiFehler v-if="fehler">{{ fehler }}</UiFehler>
  </div>
</template>

<style scoped>
.up { display: grid; gap: var(--s-2); }
.up__liste { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: var(--s-3); }
.up__kachel {
  position: relative; display: grid; place-items: center;
  width: 5.5rem; height: 5.5rem; border-radius: var(--r-sm); overflow: hidden;
  /* Linie ausgeschrieben statt var(--border-hair): so passt sie sich in .on-ink an. */
  border: 1px solid var(--c-gold-hair); background: var(--c-paper-pure);
}
.up__kachel img { width: 100%; height: 100%; object-fit: cover; display: block; }
.up__kachel--schach { background: repeating-conic-gradient(#E6E2DC 0 25%, #FFFFFF 0 50%) 0 0 / 12px 12px; }
.up__kachel--schach img { object-fit: contain; padding: 0.35rem; }
.up__pdf { font-weight: 700; letter-spacing: 0.08em; color: var(--c-danger); }
.up__x {
  position: absolute; top: 0.25rem; right: 0.25rem; display: grid; place-items: center;
  width: 1.6rem; height: 1.6rem; border-radius: 50%; background: rgb(0 0 0 / 0.65); color: #FFFFFF;
}
.up__neu {
  display: grid; place-items: center; align-content: center; gap: 0.2rem;
  width: 5.5rem; height: 5.5rem; border-radius: var(--r-sm);
  border: 1px dashed var(--c-gold); color: var(--c-gold); font-size: var(--t-2xs);
}
.up__neu:hover:not(:disabled) { background: var(--c-gold-tint); }
.up__name { overflow-wrap: anywhere; }
</style>
