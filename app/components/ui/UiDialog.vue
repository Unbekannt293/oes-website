<script setup lang="ts">
// Der eine Dialog der Seite (STYLEGUIDE.md "Dialoge"): natives <dialog>,
// mittig, Hintergrund abgedunkelt, Klick daneben oder Esc schliesst,
// runder Schliessen-Knopf auf der Ecke (wie in Louis' Entwurf).
//  - hell (Standard): weiss mit Goldkante oben
//  - dunkel: schwarz (.on-ink), z. B. Layout-Wahl
//  - bild: nur ein Bild gross, ohne Rahmen, Klick ueberall schliesst
// Oeffnen ueber ref: dialogRef.oeffnen(). @zu meldet jedes Schliessen.
const {
  dunkel = false, bild = false, polster = true, breite = '40rem', label,
} = defineProps<{
  dunkel?: boolean
  bild?: boolean
  /** Innenabstand; aus, wenn der Inhalt eigenes Raster mitbringt. */
  polster?: boolean
  breite?: string
  /** aria-label, wenn es keine sichtbare Ueberschrift mit id gibt. */
  label?: string
  /** id der sichtbaren Ueberschrift. */
  titelId?: string
}>()
const emit = defineEmits<{ zu: [] }>()

const dlg = ref<HTMLDialogElement | null>(null)
const offen = ref(false)

function oeffnen() {
  if (!dlg.value?.open) dlg.value?.showModal()
  offen.value = true
}
function schliessen() {
  if (dlg.value?.open) dlg.value.close()
}
defineExpose({ oeffnen, schliessen, el: dlg })

function klick(e: MouseEvent) {
  if (bild || e.target === dlg.value) schliessen()
}
</script>

<template>
  <dialog
    ref="dlg" class="dl" :class="{ 'dl--dunkel on-ink': dunkel, 'dl--bild': bild }"
    :style="{ '--dl-breite': breite }" :aria-label="label" :aria-labelledby="titelId"
    @click="klick" @close="offen = false; emit('zu')"
  >
    <button type="button" class="dl__x" aria-label="Schließen" @click.stop="schliessen">
      <UiIcon name="close" :size="18" />
    </button>
    <div class="dl__inhalt" :class="{ 'dl__inhalt--polster': polster && !bild }" data-lenis-prevent>
      <slot :offen="offen" />
    </div>
  </dialog>
</template>

<style scoped>
.dl {
  position: fixed; inset: 0; margin: auto; /* der Reset nimmt Dialogen den Rand */
  width: min(var(--dl-breite), calc(100vw - 2rem)); max-height: calc(100dvh - 2rem);
  padding: 0; border: 0; border-top: 3px solid var(--c-gold); border-radius: var(--r-md);
  background: var(--c-paper-pure); color: var(--c-text);
  box-shadow: var(--shadow-float);
  overflow: visible;
}
.dl::backdrop { background: var(--c-scrim); }
.dl--dunkel { background: var(--c-ink); }
.dl--bild {
  width: fit-content; max-width: min(92vw, 1100px); height: fit-content;
  border: 0; background: transparent; box-shadow: none; cursor: zoom-out;
}
.dl--bild::backdrop { background: rgb(0 0 0 / 0.85); }

.dl__inhalt { max-height: calc(100dvh - 2rem - 3px); overflow-y: auto; overscroll-behavior: contain; border-radius: inherit; }
.dl__inhalt--polster { padding: var(--s-6) var(--s-5); }
.dl--bild .dl__inhalt { overflow: visible; }
.dl--bild :deep(img) { display: block; max-width: min(92vw, 1100px); max-height: 92vh; border-radius: var(--r-sm); }

/* Schliessen: weisser Kreis auf der Ecke, auf jedem Dialog gleich. */
.dl__x {
  position: absolute; top: -1.1rem; right: -1.1rem; z-index: 2;
  display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%;
  background: #FFFFFF; color: #17171A;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
}
.dl__x:hover { color: var(--c-gold); }
/* Schmal: Ecke liegt sonst halb ausserhalb des Bildschirms. */
@media (max-width: 560px) {
  .dl__x { top: 0.5rem; right: 0.5rem; }
}
</style>
