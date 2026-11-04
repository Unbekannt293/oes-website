import type { H3Event } from 'h3'
import { heuteBerlin } from '~~/shared/preise'
import { bestelltag, erinnerungAm, fristText, fristVon, plusTage, stornoAb } from '~~/shared/zahlungsfrist'
import type { BuchungMitPositionen } from './bestellmails'

/**
 * Pruefung der offenen Ueberweisungen (Regeln in shared/zahlungsfrist.ts),
 * zweimal am Tag ueber netlify/functions/taeglich.mts -> /api/intern/taeglich:
 *
 *  1. "vorwarnen" (morgens): Louis bekommt eine Liste, wer heute erinnert
 *     bzw. storniert wird, damit er vorher noch einen Zahlungseingang
 *     abhaken kann. Kunden bekommen noch nichts. Erst wenn Louis' Mail
 *     rausging, wird die Buchung als vorgewarnt markiert.
 *  2. "ausfuehren" (4 Stunden spaeter): nur Buchungen, die heute
 *     vorgewarnt wurden, und nur wenn sie dann immer noch unbezahlt und
 *     offen sind. Was Louis inzwischen abgehakt, verlaengert oder selbst
 *     storniert hat, faellt damit von allein raus. Ging die Vorwarnung
 *     schief, passiert heute bei den Kunden nichts, morgen kommt sie neu.
 *
 * Jede Kunden-Aktion setzt zuerst ihre Markierung in der Datenbank und
 * schickt erst dann die Mail (Louis in Kopie). Bricht ein Lauf ab, geht
 * nichts doppelt raus, den Rest erledigt der naechste Lauf.
 */
export type FristSchritt = 'vorwarnen' | 'ausfuehren'

export interface FristBericht {
  heute: string
  schritt: FristSchritt
  /** vorwarnen: angekuendigt; ausfuehren: erledigt. */
  storniert: string[]
  erinnert: string[]
  morgenStorno: string[]
  /** Frist vorbei, aber das Event ist zu nah zum Stornieren: Louis klaert selbst. */
  selbstKlaeren: string[]
  offen: number
  fehler: string[]
}

const ZEITBUDGET_MS = 18_000
/** Mindestabstand zwischen Vorwarnung und Kunden-Mail (Lauf 4 h spaeter, etwas Spielraum). */
const VORLAUF_MS = 3.5 * 3_600_000

type Offen = BuchungMitPositionen & { vorgewarnt_am?: string | null }

export async function fristenPruefen(event: H3Event, schritt: FristSchritt): Promise<FristBericht> {
  const start = Date.now()
  const heute = heuteBerlin()
  const db = useSupabase()
  const bericht: FristBericht = { heute, schritt, storniert: [], erinnert: [], morgenStorno: [], selbstKlaeren: [], offen: 0, fehler: [] }

  const { data, error } = await db.from('buchungen')
    .select('*, positionen(name, detail, menge, einzelpreis_cent)')
    .eq('zahlungsart', 'ueberweisung')
    .eq('status', 'angefragt')
    .is('bezahlt_am', null)
    .order('von', { ascending: true })
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  const offen = (data ?? []) as Offen[]
  bericht.offen = offen.length

  const mitFrist = offen.map((b) => {
    const frist = fristVon(b)
    const storno = stornoAb(frist)
    const erinnerung = erinnerungAm(bestelltag(b.erstellt_am), frist)
    // Automatisch nur stornieren, wenn das vor dem Eventtag passiert. Sonst
    // bekaeme jemand nach (oder am Morgen) seiner Feier eine Storno-Mail.
    const automatisch = storno < b.von
    return {
      b, frist,
      stornoFaellig: automatisch && heute >= storno,
      erinnerungFaellig: !!erinnerung && heute >= erinnerung && heute <= frist && !b.zahlungserinnerung_am,
      morgenStorno: automatisch && plusTage(heute, 1) === storno,
      selbstKlaeren: !automatisch && heute === plusTage(frist, 1),
    }
  })
  const faellig = mitFrist.filter(x => x.stornoFaellig || x.erinnerungFaellig)

  if (schritt === 'vorwarnen') {
    bericht.storniert = faellig.filter(x => x.stornoFaellig).map(x => x.b.nummer)
    bericht.erinnert = faellig.filter(x => !x.stornoFaellig).map(x => x.b.nummer)
    bericht.morgenStorno = mitFrist.filter(x => x.morgenStorno).map(x => x.b.nummer)
    bericht.selbstKlaeren = mitFrist.filter(x => x.selbstKlaeren).map(x => `${x.b.nummer} (${fristText(x.b.von)})`)
    if (!Object.values(bericht).some(v => Array.isArray(v) && v.length)) return bericht

    try {
      await louisVorwarnen(event, bericht)
    }
    catch (err) {
      // Ohne Vorwarnung keine Kunden-Mails heute.
      bericht.fehler.push(`Vorwarnung an OES: ${(err as Error).message}`)
      return bericht
    }
    if (faellig.length) {
      const { error: e } = await db.from('buchungen').update({ vorgewarnt_am: new Date().toISOString() }).in('id', faellig.map(x => x.b.id))
      if (e) bericht.fehler.push(`Vorwarnung nicht vermerkt: ${e.message}`)
    }
    return bericht
  }

  // ---- ausfuehren ----
  const vorgewarnt = (b: Offen) => !!b.vorgewarnt_am
    && bestelltag(b.vorgewarnt_am) === heute
    && Date.now() - new Date(b.vorgewarnt_am).getTime() >= VORLAUF_MS
  const zeitDa = () => Date.now() - start < ZEITBUDGET_MS

  // Stornos zuerst, sie geben den Termin frei.
  for (const x of faellig.filter(x => x.stornoFaellig && vorgewarnt(x.b))) {
    if (!zeitDa()) break
    const { data: frei, error: e } = await db.from('buchungen')
      .update({ status: 'storniert', notiz: notizMit(x.b.notiz, `Automatisch storniert am ${fristText(heute)}: keine Zahlung bis ${fristText(x.frist)}`) })
      .eq('id', x.b.id).eq('status', 'angefragt').is('bezahlt_am', null)
      .select('id')
    if (e) { bericht.fehler.push(`${x.b.nummer}: ${e.message}`); continue }
    if (!frei?.length) continue // inzwischen abgehakt oder von Louis geaendert
    bericht.storniert.push(x.b.nummer)
    await fristStornoMelden(event, x.b).catch(err => bericht.fehler.push(`${x.b.nummer}: Storno-Mail ${(err as Error).message}`))
  }

  for (const x of faellig.filter(x => !x.stornoFaellig && x.erinnerungFaellig && vorgewarnt(x.b))) {
    if (!zeitDa()) break
    const { data: frei, error: e } = await db.from('buchungen')
      .update({ zahlungserinnerung_am: new Date().toISOString() })
      .eq('id', x.b.id).eq('status', 'angefragt').is('zahlungserinnerung_am', null).is('bezahlt_am', null)
      .select('id')
    if (e) { bericht.fehler.push(`${x.b.nummer}: ${e.message}`); continue }
    if (!frei?.length) continue
    bericht.erinnert.push(x.b.nummer)
    await zahlungErinnern(event, x.b).catch(err => bericht.fehler.push(`${x.b.nummer}: Erinnerung ${(err as Error).message}`))
  }

  // Kunden-Mails gehen in Kopie an Louis, ein Bericht nur bei Problemen.
  if (bericht.fehler.length) {
    await louisProbleme(event, bericht).catch(err => console.error('[fristen] Bericht an OES fehlgeschlagen:', err))
  }
  return bericht
}

function notizMit(alt: string | null, neu: string) {
  return alt ? `${alt}\n${neu}` : neu
}

const liste = (t: string, n: string[]) => (n.length ? `${t}\n${n.map(x => `  ${x}`).join('\n')}\n\n` : '')

/** Morgens an Louis: was in 4 Stunden passiert, wenn er nichts abhakt. */
async function louisVorwarnen(event: H3Event, r: FristBericht) {
  const { transport, from, to } = useMailer(event)
  const verwaltung = `${getRequestURL(event).origin}/admin/buchungen`
  const heuteWas = r.storniert.length + r.erinnert.length
  await transport.sendMail({
    from, to,
    subject: heuteWas
      ? `Bitte Konto prüfen: ${r.storniert.length ? `${r.storniert.length} Storno` : ''}${r.storniert.length && r.erinnert.length ? ', ' : ''}${r.erinnert.length ? `${r.erinnert.length} Erinnerung` : ''} in 4 Stunden`
      : `Zahlungsfristen ${fristText(r.heute)}`,
    text: 'Offene Überweisungen, Prüfung von heute Morgen.\n\n'
      + (heuteWas ? 'Ist das Geld bei einer dieser Buchungen schon da? Dann jetzt in der Verwaltung "Zahlung erhalten & bestätigen" tippen. Mit "Frist +3 Tage" verschiebst du alles. Was du in den nächsten 4 Stunden abhakst, bekommt keine Mail.\n\n' : '')
      + liste('In 4 Stunden storniert, Kunde bekommt Bescheid und der Termin wird frei:', r.storniert)
      + liste('In 4 Stunden bekommt der Kunde eine Zahlungserinnerung:', r.erinnert)
      + liste('Morgen dran (Storno), falls bis dahin kein Geld da ist:', r.morgenStorno)
      + liste('Frist abgelaufen, aber das Event ist zu nah zum automatischen Stornieren. Bitte selbst mit dem Kunden klären:', r.selbstKlaeren)
      + `Verwaltung: ${verwaltung}\n`,
  })
}

async function louisProbleme(event: H3Event, r: FristBericht) {
  const { transport, from, to } = useMailer(event)
  await transport.sendMail({
    from, to,
    subject: `Zahlungsfristen ${fristText(r.heute)}: Problem beim Versand`,
    text: liste('Bei der Prüfung der offenen Überweisungen ist etwas schiefgegangen:', r.fehler)
      + liste('Storniert:', r.storniert)
      + liste('Erinnert:', r.erinnert)
      + `Verwaltung: ${getRequestURL(event).origin}/admin/buchungen\n`,
  })
}
