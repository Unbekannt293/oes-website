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
      sub="Zwei Brüder aus Hamburg, die Ihre Feier mit Fotobox, Sound und persönlicher Betreuung zum Erlebnis machen."
      layout="stack"
    />

    <section class="section">
      <div class="shell ab">
        <!-- Louis in Farbe statt im Banner (Lukas, 18.10.2026). Quadratisch
             von Kopf bis Brust, das Foto wird nur verkleinert (631 px breit). -->
        <figure class="ab__louis">
          <div class="ab__louis-bg on-ink">
            <img src="/images/ueber-uns/louis.webp" alt="Louis Otto" width="631" height="902" decoding="async">
          </div>
          <figcaption>
            <span class="display ab__louis-name">Louis Otto</span>
            <span class="muted">Mitgründer und Ihr Ansprechpartner</span>
          </figcaption>
        </figure>

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
          <UiButton to="/produkte" variant="light" size="lg">Produkte ansehen</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ab { display: grid; gap: var(--s-8); }
@media (min-width: 700px) {
  .ab { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr); gap: var(--s-7) clamp(2.5rem, 5vw, 5rem); }
  .ab__louis { grid-row: span 2; }
}
@media (min-width: 1100px) {
  .ab { grid-template-columns: minmax(0, 0.75fr) minmax(0, 1fr) minmax(0, 1fr); }
  .ab__louis { grid-row: auto; }
}

.ab__louis { margin: 0; display: grid; gap: var(--s-4); align-content: start; max-width: 24rem; }
/* Dunkle Karte mit warmem Licht aus den oberen Ecken, wie die Kopfzeilen. */
.ab__louis-bg {
  aspect-ratio: 1; overflow: hidden; border-radius: var(--r-md);
  background:
    radial-gradient(60% 80% at 0% 0%, rgb(195 139 55 / 0.22), transparent 70%),
    radial-gradient(60% 80% at 100% 0%, rgb(195 139 55 / 0.22), transparent 70%),
    #0B0A09;
}
.ab__louis-bg img {
  display: block; width: 100%; height: auto;
  /* Etwas Luft ueber dem Kopf, Arme und Glas laufen unten aus der Karte. */
  margin-top: 6%;
}
.ab__louis figcaption { display: grid; gap: 0.15rem; }
.ab__louis-name { font-size: var(--t-h3); }
.ab__col { display: grid; gap: var(--s-5); align-content: start; }
.ab__col .h-col { margin-bottom: var(--s-1); }
/* Leerraum ueber den Grossbuchstaben abschneiden: so liegt die Oberkante
   von "Wer wir sind" genau auf der Oberkante von Louis' Foto. */
.ab .h-col { text-box: trim-start cap alphabetic; }
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
