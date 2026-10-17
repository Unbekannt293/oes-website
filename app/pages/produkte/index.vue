<script setup lang="ts">
import { categories, kombis, products } from '~~/shared/catalog'
import type { CategoryId } from '~~/shared/types'

useSeoMeta({
  title: 'Produkte',
  description: 'Fotobox, Soundbox und bald auch Zelte und Lichttechnik zur Miete in Hamburg.',
})

type Filter = CategoryId | 'alle'

// Filter in der URL halten: teilbar, und der Zurück-Button funktioniert.
const route = useRoute()
const router = useRouter()

const active = computed<Filter>(() => (route.query.kat as Filter) || 'alle')

function setFilter(kat: Filter) {
  router.replace({ query: kat === 'alle' ? {} : { kat } })
}

// Mietbares zuerst, damit es nicht zwischen den "Coming soon"-Kacheln
// untergeht. Array.sort ist stabil, sonst bleibt die Katalogreihenfolge.
const visible = computed(() =>
  (active.value === 'alle' ? products : products.filter(p => p.category === active.value))
    .toSorted((a, b) => Number(b.available) - Number(a.available)),
)

// Die Fotobox allein steht schon im Raster oben, hier nur die Kombis.
const withSoundbox = kombis.filter(k => k.soundboxes > 0)
</script>

<template>
  <div>
    <PageHero
      crumb="Produkte"
      title="Alles für Ihr Event, aus einer Hand."
      sub="Fotobox und Soundbox mieten Sie schon heute. Zelte und Lichttechnik folgen bald."
      image="/images/produkte/banner.webp" image-mobile="/images/produkte/banner-mobil.webp"
      tone="plain" layout="stack" focus="100% 40%"
    />

    <section class="section">
      <div class="shell">
        <div class="tabs" role="tablist" aria-label="Produktkategorien">
          <button
            class="label tab" role="tab"
            :aria-selected="active === 'alle'"
            :class="{ 'is-active': active === 'alle' }"
            @click="setFilter('alle')"
          >
            Alle
          </button>
          <button
            v-for="c in categories" :key="c.id"
            class="label tab" role="tab"
            :aria-selected="active === c.id"
            :class="{ 'is-active': active === c.id }"
            @click="setFilter(c.id)"
          >
            {{ c.label }}
          </button>
        </div>

        <div class="grid">
          <ProductCard v-for="p in visible" :key="p.slug" :product="p" />
        </div>

        <p v-if="!visible.length" class="muted empty">
          In dieser Kategorie ist gerade nichts verfügbar.
        </p>
      </div>
    </section>

    <section class="section pakete" aria-labelledby="pakete-h">
      <div class="shell">
        <div class="pakete__head">
          <h2 id="pakete-h" class="display h-col">Kombi-Pakete</h2>
          <UiButton to="/pakete" variant="solid" size="sm">
            Alle Pakete <UiIcon name="arrow" :size="14" />
          </UiButton>
        </div>
        <div class="grid">
          <ProductCard v-for="k in withSoundbox" :key="k.slug" :product="k" :to="k.to" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tabs {
  display: flex; flex-wrap: wrap; gap: var(--s-5);
  border-bottom: 1px solid var(--c-gold-hair);
  margin-bottom: var(--s-7);
}
.tab {
  padding-block: var(--s-3);
  color: var(--c-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--d-fast) var(--e-out),
              border-color var(--d-fast) var(--e-out);
}
.tab:hover { color: var(--c-text); }
.tab.is-active { color: var(--c-gold); border-bottom-color: var(--c-gold); }

.grid {
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  /* Alle Zeilen so hoch wie die hoechste: Coming-soon-Karten haben nur
     einen Namen und waren sonst in ihrer eigenen Zeile niedriger. */
  grid-auto-rows: 1fr;
}
.empty { text-align: center; padding-block: var(--s-8); }

/* ---- Pakete: heller Papierton, abgesetzt durch eine Haarlinie ---- */
.pakete { padding-top: 0; }
.pakete .shell { border-top: 1px solid var(--c-gold-hair); padding-top: var(--section-y); }
.pakete__head {
  display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between;
  gap: var(--s-4); margin-bottom: var(--s-6);
}

</style>
