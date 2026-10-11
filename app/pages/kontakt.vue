<script setup lang="ts">
const contact = useContact()

useSeoMeta({
  title: 'Kontakt',
  description:
    'Fragen Sie Zelte, Fotoboxen, Ton- und Lichttechnik für Ihr Event in '
    + 'Hamburg an. Telefon, E-Mail oder direkt über das Formular.',
})
</script>

<template>
  <div>
    <PageHero
      crumb="Kontakt"
      title="Wir freuen uns auf Ihre Anfrage."
      sub="Erzählen Sie uns von Ihrer Veranstaltung. Wir melden uns mit einem passenden Angebot."
      layout="stack"
    />

    <section class="section">
      <div class="shell kt">
        <!-- ============ Formular ============ -->
        <div class="kt__form">
          <h2 class="display h-col">Schreiben Sie uns</h2>
          <ContactForm />
        </div>

        <!-- ============ Kontaktdaten ============ -->
        <aside class="kt__info" aria-labelledby="kt-daten">
          <h2 id="kt-daten" class="display h-col">Kontaktdaten</h2>

          <ul class="kt__list">
            <li>
              <span class="kt__badge"><UiIcon name="phone" :size="18" /></span>
              <span class="kt__txt">
                <span class="label kt__lbl">Telefon</span>
                <a :href="`tel:${contact.phoneRaw}`" class="kt__val">{{ contact.phone }}</a>
              </span>
            </li>
            <li>
              <span class="kt__badge"><UiIcon name="mail" :size="18" /></span>
              <span class="kt__txt">
                <span class="label kt__lbl">E-Mail</span>
                <a :href="`mailto:${contact.email}`" class="kt__val">{{ contact.email }}</a>
              </span>
            </li>
            <li>
              <span class="kt__badge"><UiIcon name="pin" :size="18" /></span>
              <span class="kt__txt">
                <span class="label kt__lbl">Standort</span>
                <span class="kt__val">{{ contact.district }}</span>
              </span>
            </li>
          </ul>

          <!-- Selbst gezeichnete Karte statt Google-Einbettung: laedt nichts
               von Dritten, braucht also keine Einwilligung. Zeigt bewusst nur
               den Stadtteil, keine Hausnummer. Erst ein Klick oeffnet Google
               Maps in einem neuen Tab. -->
          <figure class="kt__map">
            <!-- Die ganze Karte ist klickbar. Fuer Tastatur und Screenreader
                 zaehlt nur der Link im Chip, dieser hier waere doppelt. -->
            <a :href="contact.mapsUrl" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" class="kt__maparea">
              <img
                src="/images/kontakt/tonndorf-karte.svg" width="1200" height="800"
                alt="" loading="lazy" decoding="async"
              >
            </a>
            <figcaption class="kt__mapcap">
              <a :href="contact.mapsUrl" target="_blank" rel="noopener" class="kt__chip">
                <UiIcon name="pin" :size="14" /> Wandsbek-Tonndorf
                <span class="kt__chip-go">In Google Maps öffnen <UiIcon name="arrow" :size="12" /></span>
              </a>
              <a
                class="kt__osm" href="https://www.openstreetmap.org/copyright"
                target="_blank" rel="noopener"
              >Kartendaten &copy; OpenStreetMap-Mitwirkende</a>
            </figcaption>
          </figure>

          <div class="kt__social">
            <span class="label kt__lbl">Folgen Sie uns</span>
            <div class="kt__social-links">
              <a :href="contact.social.instagram" target="_blank" rel="noopener" class="kt__soc">
                <UiIcon name="instagram" :size="18" /> Instagram
              </a>
              <a :href="contact.social.tiktok" target="_blank" rel="noopener" class="kt__soc">
                <UiIcon name="tiktok" :size="18" /> TikTok
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped>
.kt {
  display: grid; gap: var(--s-8);
}
@media (min-width: 960px) {
  .kt { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: clamp(3rem, 6vw, 6rem); }
}

.kt__form .h-col { margin-bottom: var(--s-6); }

/* ---- Kontaktdaten ---- */
.kt__info { display: grid; gap: var(--s-6); align-content: start; }
.kt__info .h-col { margin-bottom: calc(var(--s-2) * -1); }

.kt__list { list-style: none; padding: 0; display: grid; gap: var(--s-5); }
.kt__list li { display: flex; align-items: center; gap: var(--s-4); }

.kt__badge {
  display: grid; place-items: center; flex: none;
  width: 2.75rem; height: 2.75rem; border-radius: 50%;
  color: var(--c-gold);
  border: 1px solid var(--c-gold-hair);
  background: var(--c-paper-pure);
}
.kt__txt { display: grid; gap: 0.15rem; min-width: 0; }
.kt__lbl { color: var(--c-text-muted); }
.kt__val { font-size: 1.0625rem; overflow-wrap: anywhere; }
a.kt__val { transition: color var(--d-fast) var(--e-out); }
a.kt__val:hover { color: var(--c-gold); }

/* ---- Karte ---- */
.kt__map {
  position: relative;
  overflow: hidden;
  border-radius: var(--r-md);
  background: #12110F;
  box-shadow: var(--shadow-card);
}
.kt__map img {
  width: 100%; aspect-ratio: 3 / 2; object-fit: cover;
  transition: transform var(--d-slow) var(--e-out);
}
.kt__map:hover img { transform: scale(1.03); }
.kt__mapcap {
  position: absolute; inset: auto 0 0 0;
  pointer-events: none;
  display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between;
  gap: var(--s-2);
  padding: var(--s-3);
  background: linear-gradient(0deg, rgb(18 17 15 / 0.85), transparent);
}
.kt__chip, .kt__osm { pointer-events: auto; }
.kt__chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  transition: background var(--d-fast) var(--e-out);
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem; font-weight: 600;
  color: #FFFFFF;
  background: var(--c-gold);
  border-radius: var(--r-md);
}
.kt__map:hover .kt__chip { background: var(--c-gold-lift); }
.kt__chip-go {
  display: inline-flex; align-items: center; gap: 0.3rem;
  margin-left: 0.35rem; padding-left: 0.6rem;
  border-left: 1px solid rgb(255 255 255 / 0.4);
  font-weight: 500;
}
.kt__maparea { display: block; }
.kt__osm { font-size: 0.6875rem; color: #A9A296; }
.kt__osm:hover { color: #FFFFFF; }

/* ---- Social ---- */
.kt__social { display: grid; gap: var(--s-3); }
.kt__social-links { display: flex; flex-wrap: wrap; gap: var(--s-3); }
.kt__soc {
  display: inline-flex; align-items: center; gap: var(--s-2);
  padding: 0.6rem 1rem;
  font-size: var(--t-small); font-weight: 500;
  border: 1px solid var(--c-gold-hair);
  border-radius: var(--r-md);
  background: var(--c-paper-pure);
  transition: border-color var(--d-fast) var(--e-out), color var(--d-fast) var(--e-out);
}
.kt__soc svg { color: var(--c-gold); }
.kt__soc:hover { border-color: var(--c-gold); color: var(--c-gold); }
</style>
