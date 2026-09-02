<script setup lang="ts">
import { categories, products } from '~~/shared/catalog'
import type { CategoryId } from '~~/shared/types'

useSeoMeta({
  title: 'Produkte',
  description: 'Zelte, Fotoboxen, Ton- und Lichttechnik zur Miete in Hamburg.',
})

type Filter = CategoryId | 'alle'

// Filter in der URL halten: teilbar, und der Zurück-Button funktioniert.
const route = useRoute()
const router = useRouter()

const active = computed<Filter>(() => (route.query.kat as Filter) || 'alle')

function setFilter(kat: Filter) {
  router.replace({ query: kat === 'alle' ? {} : { kat } })
}

const visible = computed(() =>
  active.value === 'alle'
    ? products
    : products.filter(p => p.category === active.value),
)
</script>

<template>
  <div class="section">
    <div class="shell">
      <SectionHeading title="Unsere Produkte" sub="Alles für Ihr erfolgreiches Event." />

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
  </div>
</template>

<style scoped>
.tabs {
  display: flex; flex-wrap: wrap; gap: var(--s-5);
  justify-content: center;
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
</style>
