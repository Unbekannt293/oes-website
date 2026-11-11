<script setup lang="ts">
import { LAYOUT_GRUPPEN, LAYOUTS, layoutBild, type LayoutGruppe, type LayoutId } from '~~/shared/buchung'

// Fotolayouts (Louis, 11.11.2026): ein oder mehrere Layouts aus EINER
// Gruppe, also 1-3 Fotostreifen oder 1-7 andere. Nur Bilder, das gewaehlte
// leuchtet auf (Lukas). Tippt man in der anderen Gruppe, wechselt die
// Auswahl dorthin und ein Hinweis sagt warum. Die Namen stehen nur fuer
// Bildschirmleser im alt-Text.
const auswahl = defineModel<LayoutId[]>({ required: true })
defineProps<{ fehler?: string }>()

const gruppen = (Object.keys(LAYOUT_GRUPPEN) as LayoutGruppe[]).map(g => ({
  id: g, titel: LAYOUT_GRUPPEN[g], layouts: LAYOUTS.filter(l => l.gruppe === g),
}))
const aktiveGruppe = computed(() => LAYOUTS.find(l => l.id === auswahl.value[0])?.gruppe ?? null)
const gewechselt = ref(false)

function umschalten(id: LayoutId, gruppe: LayoutGruppe) {
  if (auswahl.value.includes(id)) {
    auswahl.value = auswahl.value.filter(x => x !== id)
    return
  }
  gewechselt.value = !!aktiveGruppe.value && aktiveGruppe.value !== gruppe
  auswahl.value = gewechselt.value ? [id] : [...auswahl.value, id]
}
</script>

<template>
  <div class="lw">
    <fieldset v-for="g in gruppen" :key="g.id" class="lw__gruppe" :class="{ 'is-aus': aktiveGruppe && aktiveGruppe !== g.id }">
      <legend class="label lw__h">{{ g.titel }}</legend>
      <ul class="lw__liste" :class="`lw__liste--${g.id}`">
        <li v-for="l in g.layouts" :key="l.id">
          <label class="lw__karte" :class="{ 'is-sel': auswahl.includes(l.id) }">
            <input
              type="checkbox" class="lw__cb" :checked="auswahl.includes(l.id)"
              @change="umschalten(l.id, l.gruppe)"
            >
            <img :src="layoutBild(l.id)" :alt="l.name" class="lw__bild">
            <span class="lw__haken" aria-hidden="true"><UiIcon name="check" :size="12" /></span>
          </label>
        </li>
      </ul>
    </fieldset>
    <UiHinweis v-if="gewechselt">Auswahl zu {{ aktiveGruppe === 'streifen' ? 'Fotostreifen' : 'Fotos' }} gewechselt.</UiHinweis>
    <UiFehler v-if="fehler">{{ fehler }}</UiFehler>
  </div>
</template>

<style scoped>
.lw { display: grid; gap: var(--s-5); }
.lw__gruppe { border: 0; padding: 0; margin: 0; min-width: 0; transition: opacity var(--d-fast) var(--e-out); }
.lw__gruppe.is-aus { opacity: 0.45; }
.lw__gruppe.is-aus:hover { opacity: 0.8; }
.lw__h { padding: 0; margin-bottom: var(--s-3); color: var(--c-gold); }
.lw__liste { list-style: none; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-4); }
.lw__karte {
  position: relative; display: block; cursor: pointer; border-radius: 4px; line-height: 0;
  transition: transform var(--d-fast) var(--e-out), box-shadow var(--d-fast) var(--e-out), filter var(--d-fast) var(--e-out);
  filter: brightness(0.82);
}
.lw__karte:hover { transform: translateY(-2px); filter: brightness(0.95); }
/* Gewaehlt: leuchtet gold auf. */
.lw__karte.is-sel {
  filter: none;
  box-shadow: 0 0 0 2px var(--c-gold), 0 0 22px 2px rgb(195 139 55 / 0.65);
}
.lw__karte:has(.lw__cb:focus-visible) { outline: 2px solid var(--c-gold); outline-offset: 4px; }
.lw__cb { position: absolute; opacity: 0; width: 1px; height: 1px; }
.lw__bild { display: block; height: 10.5rem; width: auto; border-radius: 4px; }
.lw__liste--foto .lw__bild { height: 7rem; }
.lw__haken {
  position: absolute; top: -0.45rem; right: -0.45rem; display: grid; place-items: center;
  width: 1.4rem; height: 1.4rem; border-radius: 50%;
  background: var(--c-gold); color: var(--c-on-gold); opacity: 0; transform: scale(0.6);
  transition: opacity var(--d-fast) var(--e-out), transform var(--d-fast) var(--e-out);
}
.lw__karte.is-sel .lw__haken { opacity: 1; transform: none; }
</style>
