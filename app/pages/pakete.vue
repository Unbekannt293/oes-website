<script setup lang="ts">
import { eventPackages, fotoboxPackages, SOUNDBOX_DISCOUNT_PCT } from '~~/shared/catalog'

useSeoMeta({
  title: 'Pakete',
  description:
    'Fotobox-Pakete mit und ohne Drucker, auf Wunsch mit Soundbox. '
    + 'Clever kombiniert für Ihr Event in Hamburg.',
})
</script>

<template>
  <div>
    <PageHero
      crumb="Pakete"
      title="Pakete für Ihr Event."
      sub="Clever kombiniert. Einfach feiern."
      image="/images/pakete/banner.webp" image-mobile="/images/pakete/banner-mobil.webp"
      tone="plain" layout="stack" focus="100% 40%"
    />

    <!-- Buchbares zuerst: die Fotobox-Pakete. Louis' Mockup zeigt die
         Event-Pakete oben, die sind aber noch nicht buchbar. -->
    <section class="section" aria-labelledby="fotobox-h">
      <div class="shell">
        <header class="pk-head">
          <h2 id="fotobox-h" class="display h-col">Fotobox-Pakete</h2>
          <p class="muted pk-head__sub">
            Das passende Fotobox-Erlebnis für jede Feier. Mit Soundbox sparen Sie
            {{ SOUNDBOX_DISCOUNT_PCT[1] }} %, mit zwei Soundboxen {{ SOUNDBOX_DISCOUNT_PCT[2] }} %.
          </p>
        </header>
        <div class="tiles">
          <PackageTile
            v-for="p in fotoboxPackages" :key="p.slug" :pkg="p"
            :to="`/produkte/fotobox?paket=${p.slug}#buchen`"
          />
        </div>
      </div>
    </section>

    <section class="section events" aria-labelledby="event-h">
      <div class="shell">
        <header class="pk-head">
          <h2 id="event-h" class="display h-col">Event-Komplettpakete</h2>
          <p class="muted pk-head__sub">
            Unsere Kombinationen aus Zelt, Sound, Licht und Fotobox. Bald bei uns
            buchbar, wir merken Sie gern vor.
          </p>
        </header>
        <div class="tiles tiles--three">
          <PackageTile v-for="p in eventPackages" :key="p.slug" :pkg="p" media />
        </div>
      </div>
    </section>

    <section class="section more">
      <div class="shell more__grid">
        <div class="more__box">
          <span class="more__icon"><UiIcon name="puzzle" :size="26" /></span>
          <div>
            <p class="display more__h">Alle Pakete individuell erweiterbar</p>
            <p class="muted">Zusätzliche Leistungen und Zubehör jederzeit flexibel ergänzen.</p>
          </div>
        </div>
        <div class="more__box more__box--dark on-ink">
          <span class="more__icon"><UiIcon name="chat" :size="26" /></span>
          <div>
            <p class="display more__h">Noch unsicher?</p>
            <p class="muted">Wir stellen Ihr Wunschpaket persönlich zusammen.</p>
          </div>
          <UiButton to="/kontakt" variant="solid" class="more__btn">Beratung anfragen</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pk-head { display: grid; gap: var(--s-4); margin-bottom: var(--s-8); }
.pk-head__sub { max-width: 56ch; }

.tiles {
  display: grid; gap: var(--s-7) var(--s-5);
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}
.tiles--three { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }

.events { padding-top: 0; }
.events .shell { border-top: 1px solid var(--c-gold-hair); padding-top: var(--section-y); }

.more { padding-top: 0; }
.more__grid { display: grid; gap: var(--s-5); }
@media (min-width: 900px) { .more__grid { grid-template-columns: 1fr 1.2fr; } }
.more__box {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-4) var(--s-5);
  padding: var(--s-6);
  background: var(--c-paper-pure);
  border: var(--border-hair);
  border-radius: var(--r-md);
}
.more__box--dark { border-color: transparent; }
.more__box > div { flex: 1 1 14rem; }
.more__icon { color: var(--c-gold); flex: none; }
.more__h { font-size: var(--t-h3); margin-bottom: var(--s-1); }
.more__btn { flex: none; }
</style>
