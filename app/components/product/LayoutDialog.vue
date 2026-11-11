<script setup lang="ts">
import { layoutFehler, type LayoutId } from '~~/shared/buchung'

// Popup "Fotolayout waehlen" (Lukas, 11.11.2026): erscheint im
// Buchungskasten, wenn beim Zubehoer das eigene Layout gewaehlt (oder im
// Paket enthalten) ist und man auf "Weiter" tippt. Dunkler Grund, damit
// die gewaehlten Layouts aufleuchten. Logo optional.
const layouts = defineModel<LayoutId[]>('layouts', { required: true })
const logo = defineModel<string | null>('logo', { default: null })
const logoName = defineModel<string>('logoName', { default: '' })
const emit = defineEmits<{ fertig: [] }>()

const dlg = ref<HTMLDialogElement | null>(null)
const fehler = ref('')
const logoFehler = ref('')
const logoInput = ref<HTMLInputElement | null>(null)
watch(layouts, () => { fehler.value = '' })

function oeffnen() {
  fehler.value = ''
  dlg.value?.showModal()
}
defineExpose({ oeffnen })

async function logoWaehlen(e: Event) {
  const input = e.target as HTMLInputElement
  const datei = input.files?.[0]
  input.value = ''
  if (!datei) return
  logoFehler.value = ''
  try {
    logo.value = await logoLesen(datei)
    logoName.value = datei.name
  }
  catch (err) {
    logoFehler.value = (err as Error).message
  }
}

function uebernehmen() {
  const f = layoutFehler(layouts.value)
  if (f) { fehler.value = f; return }
  dlg.value?.close()
  emit('fertig')
}
</script>

<template>
  <dialog ref="dlg" class="ld" aria-labelledby="ld-h" @click="(e) => e.target === dlg && dlg?.close()">
    <div class="ld__box">
      <header class="ld__head">
        <div>
          <h2 id="ld-h" class="display ld__h">Fotolayout wählen</h2>
          <p class="ld__sub">Wählen Sie ein oder mehrere Layouts. Fotostreifen und Fotos lassen sich nicht mischen.</p>
        </div>
        <button type="button" class="ld__x" aria-label="Schließen" @click="dlg?.close()"><UiIcon name="close" :size="18" /></button>
      </header>

      <LayoutWahl v-model="layouts" :fehler="fehler" />

      <div class="ld__logo">
        <p class="label ld__logo-h">Ihr Logo <span class="ld__opt">(optional)</span></p>
        <p class="ld__hint">
          PNG, JPG, SVG oder PDF. Am besten als SVG/PDF oder als PNG mit transparentem Hintergrund.
          Sehr große Bilddateien verkleinern wir auf 1600 Pixel, das reicht für einen scharfen Druck.
        </p>
        <div v-if="logo" class="ld__logo-da">
          <span v-if="logo.startsWith('data:application/pdf')" class="ld__pdf" aria-label="PDF-Datei">PDF</span>
          <img v-else :src="logo" alt="Ihr Logo">
          <span class="ld__logo-name">{{ logoName }}</span>
          <button type="button" class="ld__logo-x" @click="logo = null; logoName = ''">Entfernen</button>
        </div>
        <button v-else type="button" class="ld__logo-btn" @click="logoInput?.click()">
          <UiIcon name="camera" :size="18" /> Logo hochladen
        </button>
        <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,.svg,.pdf" class="visually-hidden" tabindex="-1" @change="logoWaehlen">
        <p v-if="logoFehler" class="ld__err" role="alert"><UiIcon name="alert" :size="14" /> {{ logoFehler }}</p>
      </div>

      <UiButton variant="solid" class="ld__ok" @click="uebernehmen">
        Übernehmen{{ layouts.length ? ` (${layouts.length})` : '' }} <UiIcon name="arrow" :size="14" />
      </UiButton>
    </div>
  </dialog>
</template>

<style scoped>
.ld {
  position: fixed; inset: 0; margin: auto; padding: 0; border: 0;
  width: min(44rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem);
  border-radius: var(--r-md); background: #0B0A09; color: #F4EFE6;
  box-shadow: 0 30px 80px -20px rgb(0 0 0 / 0.6);
}
.ld::backdrop { background: rgb(0 0 0 / 0.6); }
.ld__box { display: grid; gap: var(--s-5); padding: var(--s-6) var(--s-5); overflow-y: auto; max-height: calc(100dvh - 2rem); }
.ld__head { display: flex; justify-content: space-between; align-items: start; gap: var(--s-4); }
.ld__h { font-size: var(--t-h2); line-height: 1.05; color: #FFFFFF; }
.ld__sub { font-size: var(--t-small); color: rgb(244 239 230 / 0.65); margin-top: var(--s-1); }
.ld__x { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 50%; color: #FFFFFF; border: 1px solid rgb(255 255 255 / 0.2); flex: none; }
.ld__x:hover { border-color: var(--c-gold); color: var(--c-gold); }
.ld__logo { display: grid; gap: var(--s-3); padding-top: var(--s-4); border-top: 1px solid rgb(255 255 255 / 0.12); }
.ld__logo-h { color: var(--c-gold); }
.ld__hint { font-size: 0.8125rem; line-height: 1.5; color: rgb(244 239 230 / 0.65); }
.ld__opt { text-transform: none; letter-spacing: 0; font-weight: 400; color: rgb(244 239 230 / 0.6); }
.ld__logo-btn {
  justify-self: start; display: inline-flex; align-items: center; gap: var(--s-2);
  padding: 0.6rem 1rem; border-radius: var(--r-sm); border: 1px dashed var(--c-gold); color: var(--c-gold); font-size: var(--t-small);
}
.ld__logo-btn:hover { background: rgb(195 139 55 / 0.1); }
.ld__logo-da { display: flex; align-items: center; gap: var(--s-3); flex-wrap: wrap; }
/* Schachbrett: zeigt, ob das Logo einen transparenten Hintergrund hat. */
.ld__logo-da img {
  width: 4.5rem; height: 4.5rem; object-fit: contain; padding: 0.3rem; border-radius: var(--r-sm);
  background: repeating-conic-gradient(#DDD 0 25%, #FFF 0 50%) 0 0 / 12px 12px;
}
.ld__pdf {
  display: grid; place-items: center; width: 4.5rem; height: 4.5rem; border-radius: var(--r-sm);
  background: #F4EFE6; color: #B3261E; font-weight: 700; letter-spacing: 0.08em;
}
.ld__logo-name { font-size: var(--t-small); overflow-wrap: anywhere; flex: 1; min-width: 8rem; }
.ld__logo-x { font-size: var(--t-small); color: #E06B5C; text-decoration: underline; }
.ld__err { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; color: #E06B5C; }
.ld__ok { justify-self: end; gap: var(--s-2); }
</style>
