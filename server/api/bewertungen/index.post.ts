import { z } from 'zod'
import { BEZUEGE } from '~~/shared/bewertungen'
import { bewertungSchema } from '~~/shared/schemas'

// Neue Bewertung: wird unsichtbar gespeichert, Louis bekommt eine Mail mit
// Link zum Freischalten. Erst danach erscheint sie auf der Seite.
// POST /api/bewertungen { name, sterne, text, bezug, website, einwilligung }
export default defineEventHandler(async (event) => {
  const parsed = bewertungSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validierung fehlgeschlagen', data: { fields: z.flattenError(parsed.error).fieldErrors } })
  }
  // Honeypot: so tun, als waere alles gut.
  if (parsed.data.website) return { ok: true }

  const { name, sterne, text, bezug } = parsed.data
  const { data, error } = await useSupabase()
    .from('bewertungen')
    .insert({ name, sterne, text, bezug })
    .select('id, freigabe_token')
    .single<{ id: string, freigabe_token: string }>()
  if (error || !data) {
    console.error('[bewertungen] Speichern fehlgeschlagen:', error?.message)
    throw createError({ statusCode: 502, statusMessage: 'Bewertung konnte nicht gespeichert werden' })
  }

  // Link auf die eigene Adresse, damit er auch lokal und in Vorschauen stimmt.
  const link = `${getRequestURL(event).origin}/bewertungen/freigabe?id=${data.id}&t=${data.freigabe_token}`
  const worauf = bezug ? BEZUEGE[bezug] : 'allgemein'
  try {
    const { transport, from, to } = useMailer(event)
    await transport.sendMail({
      from, to,
      subject: `Neue Bewertung (${sterne} von 5 Sternen) von ${name}`,
      text: `${name} hat ${sterne} von 5 Sternen vergeben (${worauf}):\n\n${text}\n\n`
        + `Freischalten oder löschen:\n${link}\n\n`
        + 'Bis zur Freischaltung ist die Bewertung auf der Seite nicht zu sehen.\n',
    })
  }
  catch (err) {
    // Gespeichert ist sie trotzdem, Louis findet sie im Table Editor.
    console.error('[bewertungen] Mail an OES fehlgeschlagen:', err)
  }
  return { ok: true }
})
