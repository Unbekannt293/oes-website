import { z } from 'zod'
import { anfrageSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = anfrageSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validierung fehlgeschlagen',
      data: { fields: z.flattenError(parsed.error).fieldErrors },
    })
  }

  // Honeypot: Bots fuellen unsichtbare Felder aus. Wir tun so, als
  // hätte es geklappt, damit sie es nicht erneut versuchen.
  if (parsed.data.website) {
    return { ok: true }
  }

  const a = parsed.data
  const { transport, from, to } = useMailer(event)
  const name = `${a.vorname} ${a.nachname}`
  const datum = a.eventDatum.split('-').reverse().join('.')

  // 1. Anfrage an Louis. "Antworten" geht direkt an den Kunden.
  const zeilen = [
    ['Name', name],
    ['E-Mail', a.email],
    ['Telefon', a.telefon],
    ['Veranstaltung am', datum],
  ]
  try {
    await transport.sendMail({
      from, to,
      replyTo: { name, address: a.email },
      subject: `Anfrage von ${name} für den ${datum}`,
      text: `${zeilen.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${a.nachricht}\n`,
      html: `<table cellpadding="4">${zeilen.map(([k, v]) =>
        `<tr><td><b>${k}</b></td><td>${escapeHtml(v!)}</td></tr>`).join('')}</table>`
        + `<p style="white-space:pre-wrap">${escapeHtml(a.nachricht)}</p>`,
    })
  }
  catch (err) {
    console.error('[anfrage] Versand an OES fehlgeschlagen:', err)
    throw createError({ statusCode: 502, statusMessage: 'Mailversand fehlgeschlagen' })
  }

  // 2. Kurze Eingangsbestaetigung an den Kunden. Bewusst ohne seinen
  // Nachrichtentext: sonst koennte jemand mit fremder Adresse beliebigen
  // Text ueber unser Postfach verschicken. Scheitert sie, ist die Anfrage
  // trotzdem bei Louis angekommen, also kein Fehler fuer den Kunden.
  try {
    await transport.sendMail({
      from, to: a.email,
      replyTo: from,
      subject: 'Ihre Anfrage bei Otto\'s Event Service',
      text: `Hallo ${a.vorname},\n\nvielen Dank für Ihre Anfrage für den ${datum}. `
        + 'Wir melden uns so schnell wie möglich bei Ihnen.\n\n'
        + 'Viele Grüße\nLouis Otto\nOtto\'s Event Service\n',
    })
  }
  catch (err) {
    console.error('[anfrage] Bestaetigung an Kunden fehlgeschlagen:', err)
  }

  return { ok: true }
})
