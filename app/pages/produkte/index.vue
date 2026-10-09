<script setup lang="ts">
import { allPackages, categories, products } from '~~/shared/catalog'
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

// Die in Louis' Mockup hervorgehobenen Pakete ("Am beliebtesten").
const popular = allPackages.filter(p => p.highlight)
</script>

<template>
  <div>
    <PageHero
      crumb="Produkte"
      title="Alles für Ihr Event, aus einer Hand."
      sub="Fotobox und Soundbox mieten Sie schon heute. Zelte und Lichttechnik folgen bald."
      image="/images/produkte/banner.webp" tone="mono"
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
          <h2 id="pakete-h" class="display h-col">Beliebte Pakete</h2>
          <UiButton to="/pakete" variant="ghost" size="sm">
            Alle Pakete <UiIcon name="arrow" :size="14" />
          </UiButton>
        </div>
        <div class="pakete__grid">
          <PackageCard v-for="p in popular" :key="p.slug" :pkg="p" />
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
}
.empty { text-align: center; padding-block: var(--s-8); }

/* ---- Pakete: heller Papierton, abgesetzt durch eine Haarlinie ---- */
.pakete { padding-top: 0; }
.pakete .shell { border-top: 1px solid var(--c-gold-hair); padding-top: var(--section-y); }
.pakete__head {
  display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between;
  gap: var(--s-4); margin-bottom: var(--s-6);
}
/* Spaltentitel wie auf der Kontaktseite: Displayschrift, kurze Goldlinie. */
.h-col { font-size: var(--t-h2); }
.h-col::after {
  content: ''; display: block;
  width: 3rem; height: 1px; margin-top: var(--s-3);
  background: var(--c-gold);
}
.pakete__grid { display: grid; gap: var(--s-5); }
@media (min-width: 960px) { .pakete__grid { grid-template-columns: 1fr 1fr; } }
</style>
