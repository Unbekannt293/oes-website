<script setup lang="ts">
import type { Rechtstext } from '~~/shared/rechtstexte/typ'

// Rechtstext (AGB, Datenschutz) aus shared/rechtstexte: Inhaltsverzeichnis,
// Abschnitte mit Sprungmarken, Tabellen. Dieselben Daten erzeugen das PDF
// im Mailanhang, Seite und Anhang koennen also nicht auseinanderlaufen.
// ohneInhalt: nur der Text (im PDF-Leser steht das Inhaltsverzeichnis schon daneben).
const { text, pdf, ohneInhalt = false } = defineProps<{ text: Rechtstext, pdf?: string, ohneInhalt?: boolean }>()
const anker = (i: number) => `abschnitt-${i + 1}`
</script>

<template>
  <div class="rt" :class="{ 'rt--nur-text': ohneInhalt }">
    <nav v-if="!ohneInhalt" class="rt__toc" aria-label="Inhalt">
      <p class="label rt__toc-h">Inhalt</p>
      <ol>
        <li v-for="(a, i) in text.abschnitte" :key="a.titel"><a :href="`#${anker(i)}`">{{ a.titel }}</a></li>
      </ol>
      <a v-if="pdf" :href="pdf" class="rt__pdf" download>
        <UiIcon name="arrow" :size="12" /> Als PDF herunterladen
      </a>
    </nav>

    <div class="rt__body">
      <section v-for="(a, i) in text.abschnitte" :id="anker(i)" :key="a.titel" class="rt__sec">
        <h2 class="rt__h">{{ a.titel }}</h2>
        <template v-for="(p, j) in a.absaetze" :key="j">
          <p class="rt__p">{{ p }}</p>
          <table v-if="a.tabelle && a.tabelleNach === j + 1" class="rt__table">
            <thead><tr><th>{{ a.tabelle.kopf[0] }}</th><th>{{ a.tabelle.kopf[1] }}</th></tr></thead>
            <tbody><tr v-for="z in a.tabelle.zeilen" :key="z[0]"><td>{{ z[0] }}</td><td>{{ z[1] }}</td></tr></tbody>
          </table>
        </template>
      </section>
      <p class="rt__stand muted">{{ text.stand }}</p>
    </div>
  </div>
</template>

<style scoped>
.rt { display: grid; gap: var(--s-7); }
@media (min-width: 1000px) {
  .rt:not(.rt--nur-text) { grid-template-columns: 17rem minmax(0, 1fr); align-items: start; }
  .rt__toc { position: sticky; top: calc(var(--hdr-h, 78px) + var(--s-5)); max-height: calc(100vh - 8rem); overflow-y: auto; }
}
.rt__toc { display: grid; gap: var(--s-3); padding: var(--s-5); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); font-size: var(--t-small); }
.rt__toc-h { color: var(--c-gold); }
.rt__toc ol { list-style: none; padding: 0; display: grid; gap: 0.35rem; }
.rt__toc a { color: var(--c-text-muted); }
.rt__toc a:hover { color: var(--c-gold); }
.rt__pdf { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: var(--s-2); color: var(--c-gold) !important; font-weight: 600; }
.rt__body { max-width: 72ch; display: grid; gap: var(--s-6); }
.rt__sec { display: grid; gap: var(--s-3); scroll-margin-top: calc(var(--hdr-h, 78px) + var(--s-4)); }
.rt__h { font-size: 1.15rem; font-weight: 700; }
.rt__p { line-height: 1.7; overflow-wrap: anywhere; }
.rt__table { width: 100%; border-collapse: collapse; font-size: var(--t-small); background: var(--c-paper-pure); }
.rt__table th, .rt__table td { text-align: left; padding: 0.55rem 0.75rem; border: var(--border-hair); }
.rt__table th { background: var(--c-paper); font-weight: 600; }
.rt__stand { font-size: var(--t-small); }
</style>
