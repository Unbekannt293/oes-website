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
    />

    <section class="section">
      <div class="shell kt">
        <!-- ============ Formular ============ -->
        <div class="kt__form">
          <h2 class="display kt__h">Schreiben Sie uns</h2>
          <ContactForm />
        </div>

        <!-- ============ Kontaktdaten ============ -->
        <aside class="kt__info" aria-labelledby="kt-daten">
          <h2 id="kt-daten" class="display kt__h">Kontaktdaten</h2>

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
               den Stadtteil, keine Hausnummer. -->
          <figure class="kt__map">
            <img
              src="/images/kontakt/tonndorf-karte.svg" width="1200" height="800"
              alt="Karte von Hamburg-Tonndorf mit den Nachbarstadtteilen Wandsbek, Jenfeld, Rahlstedt und Farmsen-Berne"
              loading="lazy" decoding="async"
            >
            <figcaption class="kt__mapcap">
              <span class="kt__chip"><UiIcon name="pin" :size="14" /> Wandsbek-Tonndorf</span>
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

/* Spaltentitel: Displayschrift mit kurzer Goldlinie darunter, wie im Mockup. */
.kt__h { font-size: var(--t-h2); }
.kt__h::after {
  content: ''; display: block;
  width: 3rem; height: 1px; margin-top: var(--s-3);
  background: var(--c-gold);
}
.kt__form .kt__h { margin-bottom: var(--s-6); }

/* ---- Kontaktdaten ---- */
.kt__info { display: grid; gap: var(--s-6); align-content: start; }
.kt__info .kt__h { margin-bottom: calc(var(--s-2) * -1); }

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
.kt__map img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; }
.kt__mapcap {
  position: absolute; inset: auto 0 0 0;
  display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between;
  gap: var(--s-2);
  padding: var(--s-3);
  background: linear-gradient(0deg, rgb(18 17 15 / 0.85), transparent);
}
.kt__chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem; font-weight: 600;
  color: #FFFFFF;
  background: var(--c-gold);
  border-radius: var(--r-md);
}
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
