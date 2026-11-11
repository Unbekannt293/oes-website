<script setup lang="ts">
import type { AdminBuchungDaten } from '~~/shared/admin'
import { formatPrice } from '~~/shared/pricing'
import { heuteBerlin } from '~~/shared/preise'
import { fristText, fristVon, stornoAb } from '~~/shared/zahlungsfrist'
import { ANLAESSE, type Anlass, layoutBild, type LayoutId, layoutName } from '~~/shared/buchung'

// Eine Buchung in der Verwaltung: alles Wichtige auf einen Blick und jede
// Nachtrage-Aktion mit einem Tipp (Status, Zahlung, Kaution, Fahrtkosten,
// Notiz). Antwortet der Server, ersetzt seine Fassung die alte.

const b = defineModel<AdminBuchungDaten>({ required: true })
const { api } = useAdmin()
const laeuft = ref(false)
const fehler = ref('')

const STATUS = { angefragt: 'Neu', bestaetigt: 'Bestätigt', storniert: 'Storniert' } as const
const zeitraum = computed(() => b.value.von === b.value.bis ? adminDatum(b.value.von) : `${adminDatum(b.value.von)} bis ${adminDatum(b.value.bis)}`)
// Offene Ueberweisung: bis wann gezahlt sein muss, ab wann automatisch storniert wird.
const fristOffen = computed(() => b.value.zahlungsart === 'ueberweisung' && !b.value.bezahlt_am && b.value.status === 'angefragt')
const frist = computed(() => fristVon(b.value))
const fristVorbei = computed(() => heuteBerlin() > frist.value)
const autoStorno = computed(() => stornoAb(frist.value) < b.value.von ? stornoAb(frist.value) : null)
const anlass = computed(() => !b.value.anlass ? null
  : b.value.anlass === 'sonstiges' ? (b.value.anlass_text || 'Sonstiges') : ANLAESSE[b.value.anlass as Anlass] ?? b.value.anlass)
const kurz = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })

async function aendern(body: Record<string, unknown>, frage?: string) {
  if (frage && !confirm(frage)) return
  fehler.value = ''
  laeuft.value = true
  try {
    b.value = await api<AdminBuchungDaten>(`/api/admin/buchungen/${b.value.id}`, { method: 'PATCH', body })
  }
  catch (err) {
    fehler.value = (err as Error).message
  }
  finally {
    laeuft.value = false
  }
}

// Fahrtkosten nachtragen (z. B. wenn der Entfernungsdienst beim Bestellen weg war).
const fkOffen = ref(false)
const fkEuro = ref('')
const fkKm = ref('')
function fkStart() {
  fkEuro.value = (b.value.fahrtkosten_cent / 100).toFixed(2).replace('.', ',')
  fkKm.value = b.value.entfernung_km === null ? '' : String(b.value.entfernung_km).replace('.', ',')
  fkOffen.value = true
}
async function fkSpeichern() {
  const cent = Math.round(Number(fkEuro.value.replace(',', '.')) * 100)
  const km = fkKm.value.trim() ? Number(fkKm.value.replace(',', '.')) : null
  if (!Number.isFinite(cent) || cent < 0 || (km !== null && !Number.isFinite(km))) {
    fehler.value = 'Bitte Betrag und Kilometer als Zahl eingeben'
    return
  }
  await aendern({ aktion: 'fahrtkosten', cent, km })
  if (!fehler.value) fkOffen.value = false
}

const notiz = ref(b.value.notiz ?? '')
watch(() => b.value.notiz, (n) => { notiz.value = n ?? '' })
</script>

<template>
  <article class="ab" :class="`ab--${b.status}`" :aria-busy="laeuft">
    <header class="ab__head">
      <div>
        <p class="ab__datum">{{ zeitraum }}</p>
        <p class="ab__nr muted">{{ b.nummer }} · bestellt am {{ kurz(b.erstellt_am) }}</p>
      </div>
      <span class="ab__status">{{ STATUS[b.status] }}</span>
    </header>

    <div class="ab__grid">
      <section>
        <h3 class="label ab__h">{{ b.uebergabe === 'abholung' ? 'Kunde · holt selbst ab' : 'Kunde · Lieferung' }}</h3>
        <p v-if="b.firma"><strong>{{ b.firma }}</strong><small v-if="b.ust_id" class="muted"> · USt-IdNr. {{ b.ust_id }}</small></p>
        <p><strong v-if="!b.firma">{{ b.vorname }} {{ b.nachname }}</strong><template v-else>{{ b.vorname }} {{ b.nachname }}</template></p>
        <p><a :href="`tel:${b.telefon}`">{{ b.telefon }}</a></p>
        <p><a :href="`mailto:${b.email}`">{{ b.email }}</a></p>
        <p>{{ b.strasse }}, {{ b.plz }} {{ b.ort }}</p>
        <p v-if="b.adresszusatz" class="muted">{{ b.adresszusatz }}</p>
      </section>

      <section>
        <h3 class="label ab__h">Gebucht</h3>
        <ul class="ab__pos">
          <li v-for="(p, i) in b.positionen" :key="i">
            <span>{{ p.menge > 1 ? `${p.menge} × ` : '' }}{{ p.name }}<small v-if="p.detail" class="muted"> ({{ p.detail }})</small></span>
            <span>{{ formatPrice(p.einzelpreis_cent * p.menge) }}</span>
          </li>
          <li v-if="b.uebergabe === 'abholung'">
            <span>Selbstabholung</span>
            <span>{{ formatPrice(0) }}</span>
          </li>
          <li v-else>
            <span>Fahrtkosten<small class="muted"> ({{ b.entfernung_km === null ? 'offen' : `${String(b.entfernung_km).replace('.', ',')} km` }})</small></span>
            <span>{{ formatPrice(b.fahrtkosten_cent) }}</span>
          </li>
          <li class="ab__sum"><span>Gesamt</span><span>{{ formatPrice(b.summe_cent) }}</span></li>
          <li class="muted"><span>Kaution ({{ b.kaution_zahlart === 'bar' ? 'bar' : 'Überweisung' }})</span><span>{{ formatPrice(b.kaution_cent) }}</span></li>
        </ul>
        <p class="muted ab__zahl">Zahlung: {{ b.zahlungsart === 'online' ? 'online' : 'Überweisung' }}</p>
        <p v-if="anlass" class="ab__anlass"><span class="muted">Anlass:</span> {{ anlass }}</p>
        <p v-if="fristOffen" class="ab__frist" :class="{ 'is-vorbei': fristVorbei }">
          Zahlung bis {{ fristText(frist) }}<template v-if="fristVorbei">, abgelaufen</template>.
          <template v-if="autoStorno">Ohne Zahlung automatisch storniert am {{ fristText(autoStorno) }}.</template>
          <template v-else>Event zu nah für automatisches Stornieren, ohne Zahlung bitte selbst klären.</template>
          <template v-if="b.zahlungserinnerung_am"> Erinnert am {{ kurz(b.zahlungserinnerung_am) }}.</template>
        </p>
      </section>
    </div>

    <section v-if="b.layouts?.length" class="ab__layouts">
      <h3 class="label ab__h">Fotolayout{{ b.layouts.length > 1 ? 's' : '' }}</h3>
      <ul>
        <li v-for="l in b.layouts" :key="l" :title="layoutName(l)">
          <img :src="layoutBild(l as LayoutId)" :alt="layoutName(l)" loading="lazy">
          <span>{{ layoutName(l) }}</span>
        </li>
      </ul>
      <div v-if="b.logo_pfad" class="ab__logo">
        <a :href="`/api/admin/buchungen/${b.id}/logo?ansicht=1`" target="_blank" rel="noopener" class="ab__logo-bild">
          <span v-if="b.logo_pfad.endsWith('.pdf')" class="ab__logo-pdf">PDF</span>
          <img v-else :src="`/api/admin/buchungen/${b.id}/logo?ansicht=1`" alt="Logo des Kunden">
        </a>
        <a :href="`/api/admin/buchungen/${b.id}/logo`" class="ab__link">Logo herunterladen</a>
      </div>
      <p v-else class="muted ab__ohne">Kein Logo hochgeladen</p>
    </section>

    <!-- Abhaken: Haekchen = erledigt, mit Datum. -->
    <div class="ab__checks">
      <label class="check">
        <input type="checkbox" :checked="!!b.bezahlt_am" :disabled="laeuft" @change="aendern({ aktion: 'bezahlt', wert: !b.bezahlt_am })">
        <span>Bezahlt<template v-if="b.bezahlt_am"> am {{ kurz(b.bezahlt_am) }}</template></span>
      </label>
      <label class="check">
        <input type="checkbox" :checked="!!b.kaution_erhalten_am" :disabled="laeuft" @change="aendern({ aktion: 'kaution_erhalten', wert: !b.kaution_erhalten_am })">
        <span>Kaution erhalten<template v-if="b.kaution_erhalten_am"> am {{ kurz(b.kaution_erhalten_am) }}</template></span>
      </label>
      <label class="check">
        <input type="checkbox" :checked="!!b.kaution_zurueck_am" :disabled="laeuft" @change="aendern({ aktion: 'kaution_zurueck', wert: !b.kaution_zurueck_am })">
        <span>Kaution zurückgezahlt<template v-if="b.kaution_zurueck_am"> am {{ kurz(b.kaution_zurueck_am) }}</template></span>
      </label>
    </div>

    <form v-if="fkOffen" class="ab__fk" @submit.prevent="fkSpeichern">
      <UiField :id="`fk-km-${b.id}`" label="Kilometer (einfach)" optional>
        <input :id="`fk-km-${b.id}`" v-model="fkKm" class="control" inputmode="decimal">
      </UiField>
      <UiField :id="`fk-eur-${b.id}`" label="Fahrtkosten in €">
        <input :id="`fk-eur-${b.id}`" v-model="fkEuro" class="control" inputmode="decimal" required>
      </UiField>
      <div class="ab__fk-btns">
        <UiButton variant="solid" size="sm" :disabled="laeuft">Speichern</UiButton>
        <UiButton type="button" variant="light" size="sm" @click="fkOffen = false">Abbrechen</UiButton>
      </div>
    </form>

    <div class="ab__notiz">
      <UiField :id="`notiz-${b.id}`" label="Interne Notiz" optional>
        <textarea :id="`notiz-${b.id}`" v-model="notiz" class="control" rows="2" maxlength="2000" placeholder="Nur für dich sichtbar" />
      </UiField>
      <UiButton v-if="notiz !== (b.notiz ?? '')" variant="light" size="sm" :disabled="laeuft" @click="aendern({ aktion: 'notiz', text: notiz })">
        Notiz speichern
      </UiButton>
    </div>

    <p v-if="fehler" class="ab__fehler" role="alert">{{ fehler }}</p>
    <p v-if="laeuft" class="ab__laeuft" role="status">Einen Moment, wird gespeichert bzw. die Mail wird gesendet …</p>

    <p v-if="b.bestaetigung_gesendet_am" class="ab__gesendet">
      <UiIcon name="check" :size="14" /> Buchungsbestätigung mit Rechnung{{ b.rechnungsnummer ? ` ${b.rechnungsnummer}` : '' }}
      gesendet am {{ kurz(b.bestaetigung_gesendet_am) }}
    </p>

    <footer class="ab__aktionen">
      <!-- Ueberweisung: erst nach Zahlungseingang bestaetigen (Mietbedingungen § 6). -->
      <UiButton
        v-if="b.status !== 'storniert' && !b.bezahlt_am" variant="solid" size="sm" :disabled="laeuft"
        @click="aendern({ aktion: 'bestaetigen' }, `Zahlungseingang für ${b.nummer} bestätigen? ${b.vorname} ${b.nachname} bekommt dann die Buchungsbestätigung mit Rechnung per Mail.`)"
      >
        Zahlung erhalten & bestätigen
      </UiButton>
      <UiButton
        v-else-if="b.status !== 'storniert' && !b.bestaetigung_gesendet_am" variant="solid" size="sm" :disabled="laeuft"
        @click="aendern({ aktion: 'bestaetigen' }, `Buchungsbestätigung mit Rechnung an ${b.email} senden?`)"
      >
        Bestätigung mit Rechnung senden
      </UiButton>
      <UiButton
        v-else-if="b.status !== 'storniert'" variant="light" size="sm" :disabled="laeuft"
        @click="aendern({ aktion: 'bestaetigung_senden' }, `Bestätigung mit derselben Rechnung noch einmal an ${b.email} senden?`)"
      >
        Bestätigung erneut senden
      </UiButton>
      <a :href="`/api/admin/buchungen/${b.id}/rechnung`" target="_blank" class="ab__link">Rechnung ansehen</a>
      <UiButton v-if="!fkOffen && b.status !== 'storniert'" variant="light" size="sm" @click="fkStart">Fahrtkosten ändern</UiButton>
      <UiButton
        v-if="fristOffen" variant="light" size="sm" :disabled="laeuft"
        @click="aendern({ aktion: 'frist', tage: 3 }, `Zahlungsfrist für ${b.nummer} um 3 Tage verlängern?`)"
      >
        Frist +3 Tage
      </UiButton>
      <UiButton
        v-if="b.status === 'storniert'" variant="light" size="sm" :disabled="laeuft"
        @click="aendern({ aktion: 'status', wert: 'angefragt' }, 'Buchung wieder aufnehmen? Die Termine werden dann wieder belegt.')"
      >
        Wieder aufnehmen
      </UiButton>
      <button
        v-else type="button" class="ab__storno" :disabled="laeuft"
        @click="aendern({ aktion: 'status', wert: 'storniert' }, `Buchung ${b.nummer} stornieren? Die Termine werden wieder frei.`)"
      >
        Stornieren
      </button>
    </footer>
  </article>
</template>

<style scoped>
.ab {
  display: grid; gap: var(--s-5); padding: var(--s-5);
  background: var(--c-paper-pure); border: var(--border-hair); border-left: 3px solid var(--c-gold-hair);
  border-radius: var(--r-md);
}
.ab--angefragt { border-left-color: var(--c-gold); }
.ab__frist { font-size: var(--t-small); color: var(--c-text-muted); margin-top: var(--s-1); }
.ab__frist.is-vorbei { color: var(--c-danger); }
.ab--bestaetigt { border-left-color: var(--c-success); }
.ab--storniert { opacity: 0.75; }
.ab[aria-busy='true'] { opacity: 0.6; }
.ab__head { display: flex; align-items: start; justify-content: space-between; gap: var(--s-3); }
.ab__datum { font-size: 1.15rem; font-weight: 600; }
.ab__nr { font-size: var(--t-small); }
.ab__status {
  flex: none; padding: 0.2rem 0.65rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600;
  background: var(--c-paper); color: var(--c-text);
}
.ab--angefragt .ab__status { background: var(--c-gold); color: #FFFFFF; }
.ab--bestaetigt .ab__status { background: rgb(46 125 91 / 0.12); color: var(--c-success); }
.ab__grid { display: grid; gap: var(--s-5); }
@media (min-width: 720px) { .ab__grid { grid-template-columns: 1fr 1.2fr; } }
.ab__grid section { display: grid; gap: 0.2rem; align-content: start; font-size: var(--t-small); }
.ab__grid a { text-decoration: underline; text-underline-offset: 2px; }
.ab__h { color: var(--c-text-muted); margin-bottom: var(--s-1); }
.ab__pos { list-style: none; padding: 0; display: grid; gap: 0.25rem; }
.ab__pos li { display: flex; justify-content: space-between; gap: var(--s-3); }
.ab__pos li > :last-child { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ab__sum { font-weight: 600; padding-top: 0.25rem; border-top: var(--border-hair); }
.ab__zahl { margin-top: var(--s-2); }
.ab__anlass { font-size: var(--t-small); margin-top: var(--s-1); }
.ab__layouts { display: grid; gap: var(--s-2); }
.ab__layouts ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s-3); }
.ab__layouts li { display: grid; justify-items: center; gap: 0.25rem; width: 5.5rem; font-size: 0.7rem; text-align: center; color: var(--c-text-muted); }
.ab__layouts img { height: 4.5rem; width: auto; max-width: 100%; object-fit: contain; background: #1A1614; border-radius: 3px; padding: 3px; }
.ab__ohne { font-size: var(--t-small); }
.ab__logo { display: flex; align-items: center; gap: var(--s-3); }
.ab__logo-bild { display: grid; place-items: center; width: 5rem; height: 5rem; border-radius: var(--r-sm); border: var(--border-hair);
  background: repeating-conic-gradient(#EEE 0 25%, #FFF 0 50%) 0 0 / 12px 12px; }
.ab__logo-bild img { max-width: 90%; max-height: 90%; object-fit: contain; }
.ab__logo-pdf { font-weight: 700; color: #B3261E; letter-spacing: 0.08em; }
.ab__checks { display: flex; flex-wrap: wrap; gap: var(--s-3) var(--s-6); }
.ab__checks .check { color: var(--c-text); }
.ab__fk { display: grid; gap: var(--s-3); padding: var(--s-4); background: var(--c-paper); border-radius: var(--r-md); }
@media (min-width: 560px) { .ab__fk { grid-template-columns: 1fr 1fr; } .ab__fk-btns { grid-column: 1 / -1; } }
.ab__fk-btns { display: flex; gap: var(--s-3); }
.ab__notiz { display: grid; gap: var(--s-2); justify-items: start; }
.ab__notiz :deep(.field) { width: 100%; }
.ab__fehler { color: var(--c-danger); font-size: var(--t-small); }
.ab__aktionen { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); padding-top: var(--s-4); border-top: var(--border-hair); }
.ab__laeuft { font-size: var(--t-small); color: var(--c-text-muted); }
.ab__gesendet { display: flex; align-items: center; gap: 0.4rem; font-size: var(--t-small); color: var(--c-success); }
.ab__link { font-size: var(--t-small); font-weight: 600; color: var(--c-gold); text-decoration: underline; text-underline-offset: 2px; }
.ab__storno { margin-left: auto; color: var(--c-danger); font-size: var(--t-small); font-weight: 600; }
.ab__storno:disabled { opacity: 0.5; }
</style>
