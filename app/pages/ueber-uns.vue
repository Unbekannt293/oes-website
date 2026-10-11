<script setup lang="ts">
useSeoMeta({
  title: 'Über uns',
  description:
    'Zwei Brüder aus Hamburg: Otto\'s Event Service vermietet hochwertige '
    + 'Eventausstattung unkompliziert, flexibel und fair.',
})

// Die vier Werte aus Louis' Mockup.
const values = ['Zuverlässig', 'Persönlich', 'Kompetent', 'Leidenschaftlich']
</script>

<template>
  <div>
    <PageHero
      crumb="Über uns"
      title="Ihr Partner für erfolgreiche Events."
      image="/images/ueber-uns/banner.webp"
      image-mobile="/images/ueber-uns/banner-mobil.webp" tone="mono" focus="78% 40%"
    />

    <section class="section">
      <div class="shell ab">
        <div class="ab__col">
          <h2 class="display h-col">Wer wir sind</h2>
          <p class="prose">
            Wir sind zwei Brüder aus Hamburg und stehen gemeinsam hinter OES,
            Otto's Event Service. Mit Zuverlässigkeit, Qualität und Leidenschaft
            sorgen wir dafür, dass Ihre Veranstaltung zu einem besonderen
            Erlebnis wird.
          </p>
        </div>

        <div class="ab__col">
          <h2 class="display h-col">Unsere Mission</h2>
          <p class="prose">
            Unsere Mission ist es, Ihnen hochwertige und zuverlässige
            Eventausstattung unkompliziert zur Verfügung zu stellen. Von
            Fotoboxen über Zelte bis hin zu Licht- und Tontechnik erhalten Sie
            bei uns alles aus einer Hand: flexibel, fair und passend zu Ihrer
            Veranstaltung.
          </p>
        </div>
      </div>
    </section>

    <section class="values" aria-labelledby="werte-h">
      <div class="shell">
        <h2 id="werte-h" class="label values__h">Unsere Werte</h2>
        <ul class="values__list">
          <li v-for="v in values" :key="v">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3-6.3-4.6L5.7 21 8 13.7 2 9.2h7.6z" fill="currentColor" />
            </svg>
            <span class="display">{{ v }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="section cta">
      <div class="shell cta__inner">
        <p class="display cta__text">Sie planen ein Event? Wir beraten Sie gern.</p>
        <div class="cta__btns">
          <UiButton to="/kontakt" variant="solid" size="lg">Beratung anfragen</UiButton>
          <UiButton to="/produkte" variant="ghost" size="lg">Produkte ansehen</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ab { display: grid; gap: var(--s-8); }
@media (min-width: 900px) {
  .ab { grid-template-columns: 1fr 1fr; gap: clamp(3rem, 6vw, 6rem); }
}
.ab__col { display: grid; gap: var(--s-5); align-content: start; }
.ab__col .h-col { margin-bottom: var(--s-1); }
.prose { font-size: 1.0625rem; line-height: 1.75; color: var(--c-text); }

/* ---- Werte: schmaler Streifen zwischen Haarlinien ---- */
.values {
  border-block: 1px solid var(--c-gold-hair);
  padding-block: var(--s-7);
  background: var(--c-paper-pure);
}
.values__h { color: var(--c-gold); margin-bottom: var(--s-5); }
.values__list {
  list-style: none; padding: 0;
  display: grid; gap: var(--s-5);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
.values__list li { display: flex; align-items: center; gap: var(--s-3); }
.values__list svg { color: var(--c-gold); flex: none; }
.values__list .display { font-size: var(--t-h3); }

.cta__inner { display: grid; gap: var(--s-5); justify-items: start; }
@media (min-width: 900px) {
  .cta__inner { grid-template-columns: 1fr auto; align-items: center; }
}
.cta__text { font-size: var(--t-h2); max-width: 22ch; }
.cta__btns { display: flex; flex-wrap: wrap; gap: var(--s-3); }
</style>
