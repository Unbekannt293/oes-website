<script setup lang="ts">
import type { Rechtstext } from '~~/shared/rechtstexte/typ'

// PDF-Leser fuer AGB und Datenschutz (Lukas, 04.11.2026): die Seiten des
// PDFs, links das Inhaltsverzeichnis, das genau auf die Ueberschrift
// springt, oben "Als PDF herunterladen". Gezeichnet mit pdf.js (Mozilla),
// weil eingebettete PDFs auf iPhone und Android nicht verlaesslich angezeigt
// werden. Darunter die Textfassung zum Aufklappen, fuer Bildschirmleser und
// Suchmaschinen, und als Rueckfall, falls pdf.js nicht laedt.
const { name, text } = defineProps<{ name: 'agb' | 'datenschutz', text: Rechtstext }>()

const quelle = `/api/rechtstexte/${name}`
const { data: karte } = await useFetch<{ seiten: { seite: number, oben: number }[], datei: string }>(`/api/rechtstexte/${name}/seiten`)
const seitenAnzahl = computed(() => Math.max(1, ...(karte.value?.seiten.map(s => s.seite) ?? [1])))

const seitenEl = ref<HTMLElement[]>([])
const leser = ref<HTMLElement | null>(null)
const fehler = ref(false)
const inhaltOffen = ref(true)
/** Wie viele Seiten schon gezeichnet sind (Platzhalter bis dahin). */
const fertig = ref(0)
const { lenis } = useLenis()

let doc: { numPages: number, getPage: (n: number) => Promise<unknown> } | null = null
let zuletztBreite = 0

async function zeichnen() {
  if (!doc || !leser.value) return
  const breite = leser.value.clientWidth
  if (Math.abs(breite - zuletztBreite) < 40) return
  zuletztBreite = breite
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  for (let i = 1; i <= doc.numPages; i++) {
    const seite = await doc.getPage(i) as {
      getViewport: (o: { scale: number }) => { width: number, height: number }
      render: (o: { canvasContext: CanvasRenderingContext2D, viewport: unknown }) => { promise: Promise<void> }
    }
    const ziel = seitenEl.value[i - 1]?.querySelector('canvas')
    if (!ziel) continue
    const vp = seite.getViewport({ scale: (breite / seite.getViewport({ scale: 1 }).width) * dpr })
    ziel.width = Math.floor(vp.width)
    ziel.height = Math.floor(vp.height)
    await seite.render({ canvasContext: ziel.getContext('2d')!, viewport: vp }).promise
    fertig.value = Math.max(fertig.value, i)
  }
}

let ro: ResizeObserver | null = null
onMounted(async () => {
  // Handy: Inhaltsverzeichnis zugeklappt, sonst steht es ueber dem ganzen Text.
  if (matchMedia('(max-width: 999px)').matches) inhaltOffen.value = false
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    doc = await pdfjs.getDocument(quelle).promise
    await zeichnen()
    let t: ReturnType<typeof setTimeout> | undefined
    ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(zeichnen, 200) })
    if (leser.value) ro.observe(leser.value)
  }
  catch (err) {
    console.warn('[PdfLeser] pdf.js nicht verfuegbar, Textfassung bleibt:', err)
    fehler.value = true
  }
})
onBeforeUnmount(() => ro?.disconnect())

/** Zur Ueberschrift eines Abschnitts springen: Seite plus Hoehe auf der Seite. */
function springe(i: number) {
  const stelle = karte.value?.seiten[i]
  const el = stelle && seitenEl.value[stelle.seite - 1]
  if (!el) return
  const ziel = el.getBoundingClientRect().top + window.scrollY + stelle.oben * el.offsetHeight - 100
  if (lenis.value) lenis.value.scrollTo(ziel)
  else window.scrollTo({ top: ziel, behavior: 'smooth' })
  if (matchMedia('(max-width: 999px)').matches) inhaltOffen.value = false
}
</script>

<template>
  <div class="pl">
    <aside class="pl__seite">
      <a :href="`${quelle}?download=1`" class="pl__dl" :download="karte?.datei">
        <UiIcon name="arrow" :size="14" class="pl__dl-icon" /> Als PDF herunterladen
      </a>
      <details class="pl__toc" :open="inhaltOffen" @toggle="(e) => inhaltOffen = (e.target as HTMLDetailsElement).open">
        <summary class="label pl__toc-h">Inhalt</summary>
        <ol>
          <li v-for="(a, i) in text.abschnitte" :key="a.titel">
            <button type="button" @click="fehler ? null : springe(i)">
              <a v-if="fehler" :href="`#abschnitt-${i + 1}`">{{ a.titel }}</a>
              <template v-else>{{ a.titel }}</template>
            </button>
          </li>
        </ol>
      </details>
    </aside>

    <div ref="leser" class="pl__leser">
      <template v-if="!fehler">
        <div v-for="n in seitenAnzahl" :key="n" :ref="(el) => { if (el) seitenEl[n - 1] = el as HTMLElement }" class="pl__blatt" :class="{ 'is-da': n <= fertig }">
          <canvas :aria-label="`${text.titel}, Seite ${n} von ${seitenAnzahl}`" role="img" />
        </div>
      </template>
      <!-- Ohne pdf.js: der Text direkt. Mit pdf.js zum Aufklappen. -->
      <RechtstextInhalt v-if="fehler" :text="text" ohne-inhalt />
      <details v-else class="pl__text">
        <summary>Textfassung anzeigen</summary>
        <RechtstextInhalt :text="text" ohne-inhalt />
      </details>
    </div>
  </div>
</template>

<style scoped>
.pl { display: grid; gap: var(--s-6); }
@media (min-width: 1000px) {
  .pl { grid-template-columns: 17rem minmax(0, 1fr); align-items: start; }
  .pl__seite { position: sticky; top: calc(var(--hdr-h, 78px) + var(--s-5)); max-height: calc(100vh - 8rem); overflow-y: auto; }
  .pl__toc-h { cursor: default; }
}
.pl__seite { display: grid; gap: var(--s-4); align-content: start; }
.pl__dl {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--s-2);
  padding: 0.75rem 1rem; border-radius: var(--r-sm);
  background: var(--c-gold); color: #FFFFFF;
  font-size: var(--t-label); font-weight: 600; letter-spacing: var(--tr-label); text-transform: uppercase;
}
.pl__dl:hover { background: var(--c-gold-lift); }
.pl__dl-icon { transform: rotate(90deg); }
.pl__toc { padding: var(--s-4) var(--s-5); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); font-size: var(--t-small); }
.pl__toc-h { color: var(--c-gold); cursor: pointer; list-style: none; }
.pl__toc-h::-webkit-details-marker { display: none; }
.pl__toc[open] .pl__toc-h { margin-bottom: var(--s-3); }
.pl__toc ol { list-style: none; padding: 0; display: grid; gap: 0.15rem; }
.pl__toc button { text-align: left; width: 100%; padding: 0.3rem 0; color: var(--c-text-muted); line-height: 1.35; }
.pl__toc button:hover { color: var(--c-gold); }
.pl__toc a { color: inherit; }

.pl__leser { display: grid; gap: var(--s-5); min-width: 0; max-width: 56rem; }
/* Platzhalter in A4-Form, damit die Seite beim Laden nicht springt. */
.pl__blatt {
  aspect-ratio: 595.28 / 841.89; width: 100%;
  background: #FFFFFF; border-radius: 2px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.08), 0 8px 24px rgb(0 0 0 / 0.06);
  overflow: hidden;
}
.pl__blatt:not(.is-da) { background: linear-gradient(90deg, #FFFFFF, #F6F3EE, #FFFFFF); }
.pl__blatt canvas { display: block; width: 100%; height: 100%; }
.pl__text { margin-top: var(--s-4); }
.pl__text summary { cursor: pointer; font-size: var(--t-small); color: var(--c-text-muted); margin-bottom: var(--s-5); }
.pl__text summary:hover { color: var(--c-gold); }
</style>
