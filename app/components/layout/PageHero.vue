<script setup lang="ts">
// Kopf jeder Unterseite: der schwarze Balken aus den Mockups, darin
// Titel, goldener Stern-Trenner und eine Zeile Unterzeile. Die Startseite
// hat ihren eigenen Hero, alle anderen Seiten beginnen hiermit.
defineProps<{ title: string, sub?: string, eyebrow?: string }>()
</script>

<template>
  <header class="ph on-ink">
    <div class="shell ph__inner">
      <p v-if="eyebrow" class="label ph__eyebrow">{{ eyebrow }}</p>
      <h1 class="display ph__title">{{ title }}</h1>
      <div class="ph__rule" aria-hidden="true">
        <span /><svg viewBox="0 0 24 24" width="11" height="11"><path
          d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3-6.3-4.6L5.7 21 8 13.7 2 9.2h7.6z"
          fill="currentColor" /></svg><span />
      </div>
      <p v-if="sub" class="ph__sub">{{ sub }}</p>
    </div>
  </header>
</template>

<style scoped>
.ph {
  position: relative;
  overflow: hidden;
  /* Warmer Lichtschein von oben, wie eine Lichterkette ueber dem Titel. */
  background:
    radial-gradient(ellipse 55% 90% at 50% -10%, rgb(195 139 55 / 0.16), transparent 70%),
    var(--c-ink);
}
/* Goldene Haarlinie als Uebergang zum hellen Inhalt, zu den Raendern hin
   ausgeblendet. */
.ph::after {
  content: '';
  position: absolute; inset-inline: 0; bottom: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-gold) 50%, transparent);
  opacity: 0.55;
}

.ph__inner {
  display: grid; justify-items: center; gap: var(--s-3);
  text-align: center;
  padding-block: clamp(3rem, 2rem + 5vw, 5.5rem) clamp(2.75rem, 1.8rem + 4vw, 4.75rem);
}

.ph__eyebrow { color: var(--c-gold); }
.ph__title { font-size: var(--t-h1); }

.ph__rule {
  display: flex; align-items: center; gap: var(--s-2);
  width: min(220px, 60%); color: var(--c-gold);
}
.ph__rule span { flex: 1; height: 1px; background: var(--c-gold-hair); }

.ph__sub {
  max-width: 46ch;
  color: var(--c-text-muted);
  font-size: clamp(1.05rem, 0.98rem + 0.3vw, 1.2rem);
}
</style>
