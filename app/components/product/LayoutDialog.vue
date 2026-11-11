<script setup lang="ts">
import { layoutFehler, type LayoutId } from '~~/shared/buchung'

// Popup "Fotolayout waehlen" (Lukas, 11.11.2026): erscheint im
// Buchungskasten, wenn beim Zubehoer das eigene Layout gewaehlt (oder im
// Paket enthalten) ist und man auf "Weiter" tippt. Dunkler Grund, damit
// die gewaehlten Layouts aufleuchten. Logo optional, Upload wie bei den
// Bewertungsfotos (UiUpload). Farben aus .on-ink (tokens.css).
const layouts = defineModel<LayoutId[]>('layouts', { required: true })
const logo = defineModel<string | null>('logo', { default: null })
const logoName = defineModel<string>('logoName', { default: '' })
const emit = defineEmits<{ fertig: [] }>()

const dlg = ref<{ oeffnen: () => void, schliessen: () => void } | null>(null)
const fehler = ref('')
/** Fuer UiUpload: das eine Logo als Liste. */
const logoListe = computed({
  get: () => (logo.value ? [{ src: logo.value, name: logoName.value }] : []),
  set: (v: { src: string, name?: string }[]) => { logo.value = v[0]?.src ?? null; logoName.value = v[0]?.name ?? '' },
})
watch(layouts, () => { fehler.value = '' })

function oeffnen() {
  fehler.value = ''
  dlg.value?.oeffnen()
}
defineExpose({ oeffnen })

function uebernehmen() {
  const f = layoutFehler(layouts.value)
  if (f) { fehler.value = f; return }
  dlg.value?.schliessen()
  emit('fertig')
}
</script>

<template>
  <UiDialog ref="dlg" dunkel breite="44rem" titel-id="ld-h">
    <div class="ld__box">
      <header>
        <h2 id="ld-h" class="display ld__h">Fotolayout wählen</h2>
        <p class="ld__sub">Wählen Sie ein oder mehrere Layouts. Fotostreifen und Fotos lassen sich nicht mischen.</p>
      </header>

      <LayoutWahl v-model="layouts" :fehler="fehler" />

      <div class="ld__logo">
        <p class="label ld__logo-h">Ihr Logo <span class="ld__opt">(optional)</span></p>
        <p class="notiz ld__hint">
          PNG, JPG, SVG oder PDF. Am besten als SVG/PDF oder als PNG mit transparentem Hintergrund.
          Sehr große Bilddateien verkleinern wir auf 1600 Pixel, das reicht für einen scharfen Druck.
        </p>
        <UiUpload
          v-model="logoListe" :lesen="logoLesen" label="Logo" schachbrett
          accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,.svg,.pdf"
        />
      </div>

      <UiButton variant="solid" class="ld__ok" @click="uebernehmen">
        Übernehmen{{ layouts.length ? ` (${layouts.length})` : '' }} <UiIcon name="arrow" :size="14" />
      </UiButton>
    </div>
  </UiDialog>
</template>

<style scoped>
.ld__box { display: grid; gap: var(--s-5); }
.ld__h { font-size: var(--t-h2); line-height: 1.05; color: #FFFFFF; }
.ld__sub { font-size: var(--t-small); color: var(--c-text-muted); margin-top: var(--s-1); }
.ld__logo { display: grid; gap: var(--s-3); padding-top: var(--s-4); border-top: 1px solid var(--c-gold-hair); }
.ld__logo-h { color: var(--c-gold); }
.ld__hint { line-height: 1.5; }
.ld__opt { text-transform: none; letter-spacing: 0; font-weight: 400; color: var(--c-text-muted); }
.ld__ok { justify-self: end; gap: var(--s-2); }
</style>
