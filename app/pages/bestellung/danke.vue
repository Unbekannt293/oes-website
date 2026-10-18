<script setup lang="ts">
// Rueckkehr von der Bezahlseite (Stripe). Der Server fragt bei Stripe nach
// und verbucht die Zahlung; erst dann leeren wir den Warenkorb.
// Bei Lastschrift oder Klarna kann die Zahlung noch "in Bearbeitung" sein:
// Bestellung steht trotzdem, die Mails kommen, sobald Stripe sie bestaetigt.
useSeoMeta({ title: 'Danke für Ihre Bestellung', robots: 'noindex, nofollow' })

const route = useRoute()
const { clear } = useCart()
const sessionId = typeof route.query.session_id === 'string' ? route.query.session_id : ''

const { data, error } = await useFetch('/api/zahlung', {
  query: { session_id: sessionId },
  server: false,
  immediate: !!sessionId,
})

// Warenkorb und gemerkte Kassen-Angaben erst leeren, wenn die Bestellung steht.
watch(data, (d) => {
  if (!d || d.status !== 'complete') return
  onNuxtReady(() => {
    clear()
    try { sessionStorage.removeItem('oes-kasse') }
    catch { /* egal */ }
  })
}, { immediate: true })
</script>

<template>
  <div>
    <PageHero crumb="Bestellung" title="Vielen Dank!" slim />
    <div class="section shell dk">
      <div class="dk__box">
        <template v-if="data">
          <span class="dk__icon"><UiIcon name="check" :size="26" /></span>
          <h2 class="display dk__h">
            {{ data.bezahlt ? 'Zahlung erhalten.' : 'Bestellung eingegangen.' }}
          </h2>
          <p v-if="data.nummer" class="muted">Bestellnummer <strong>{{ data.nummer }}</strong></p>
          <p v-if="data.bezahlt">
            Sie erhalten in Kürze eine Bestellbestätigung, die Rechnung und noch
            einmal den Mietvertrag per E-Mail.
          </p>
          <p v-else>
            Ihre Zahlung wird noch bearbeitet. Sobald sie bestätigt ist, erhalten Sie
            Bestellbestätigung, Rechnung und Mietvertrag per E-Mail.
          </p>
        </template>
        <template v-else-if="error || !sessionId">
          <h2 class="display dk__h">Diese Seite ist abgelaufen.</h2>
          <p class="muted">
            Falls Sie gerade bestellt haben, finden Sie alle Angaben in Ihrer
            Bestätigungs-E-Mail.
          </p>
        </template>
        <p v-else class="muted" aria-live="polite">Zahlung wird geprüft …</p>
        <UiButton to="/" variant="solid">Zur Startseite</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dk { padding-top: var(--s-8); }
.dk__box {
  display: grid; justify-items: center; gap: var(--s-3); text-align: center;
  max-width: 34rem; margin-inline: auto; padding: var(--s-8) var(--s-6);
  background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md);
}
.dk__icon {
  display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%;
  color: var(--c-gold); border: 1px solid var(--c-gold-hair);
}
.dk__h { font-size: var(--t-h3); }
</style>
