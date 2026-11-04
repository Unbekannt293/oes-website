<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Anmelden', robots: 'noindex, nofollow' })

const route = useRoute()
const passwort = ref('')
const fehler = ref('')
const laeuft = ref(false)
const { data: status } = await useFetch('/api/admin/status')

async function anmelden() {
  fehler.value = ''
  laeuft.value = true
  try {
    await $fetch('/api/admin/anmelden', { method: 'POST', body: { passwort: passwort.value } })
    const weiter = typeof route.query.weiter === 'string' && route.query.weiter.startsWith('/admin') ? route.query.weiter : '/admin/buchungen'
    await navigateTo(weiter)
  }
  catch (err) {
    const e = err as { statusCode?: number }
    fehler.value = e.statusCode === 429 ? 'Zu viele Versuche. Bitte später noch einmal.' : 'Das Passwort stimmt nicht.'
    laeuft.value = false
  }
}
</script>

<template>
  <div class="an">
    <h1 class="display an__h">Anmelden</h1>
    <p v-if="status && !status.eingerichtet" class="an__fehler" role="alert">
      Die Verwaltung ist auf diesem Server noch nicht eingerichtet (NUXT_ADMIN_PASSWORD und NUXT_ADMIN_SESSION_SECRET fehlen).
    </p>
    <form v-else class="an__form" @submit.prevent="anmelden">
      <UiField id="pw" label="Passwort">
        <input id="pw" v-model="passwort" class="control" type="password" autocomplete="current-password" required>
      </UiField>
      <p v-if="fehler" class="an__fehler" role="alert">{{ fehler }}</p>
      <UiButton variant="solid" :disabled="laeuft || !passwort">{{ laeuft ? 'Einen Moment …' : 'Anmelden' }}</UiButton>
    </form>
  </div>
</template>

<style scoped>
.an { max-width: 24rem; margin: var(--s-8) auto 0; display: grid; gap: var(--s-5); }
.an__h { font-size: var(--t-h2); }
.an__form { display: grid; gap: var(--s-4); padding: var(--s-6); background: var(--c-paper-pure); border: var(--border-hair); border-radius: var(--r-md); }
.an__fehler { color: var(--c-danger); font-size: var(--t-small); }
</style>
