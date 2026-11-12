import { z } from 'zod'
import { BEZUEGE } from '~~/shared/bewertungen'
import { bewertungSchema } from '~~/shared/schemas'

// Neue Bewertung: wird unsichtbar gespeichert, Louis bekommt eine Mail mit
// Link zum Freischalten. Erst danach erscheint sie auf der Seite.
// Fotos (bis zu 3) landen im Storage, sichtbar erst mit der Bewertung.
// POST /api/bewertungen { name, sterne, text, bezug, bilder, website, einwilligung }
export default defineEventHandler(async (event) => {
  bremse(event, 'bewertung', 3, STUNDE)
  const parsed = bewertungSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validierung fehlgeschlagen', data: { fields: z.flattenError(parsed.error).fieldErrors } })
  }
  // Honeypot und Zeitfalle: so tun, als waere alles gut.
  if (parsed.data.website || zuSchnell(parsed.data.ausfuellzeit)) return { ok: true }

  const { name, sterne, text, bezug, bilder } = parsed.data
  const { data, error } = await useSupabase()
    .from('bewertungen')
    .insert({ name, sterne, text, bezug })
    .select('id, freigabe_token')
    .single<{ id: string, freigabe_token: string }>()
  if (error || !data) {
    console.error('[bewertungen] Speichern fehlgeschlagen:', error?.message)
    throw createError({ statusCode: 502, statusMessage: 'Bewertung konnte nicht gespeichert werden' })
  }

  // Fotos nach der Bewertung: scheitert der Upload, bleibt der Text trotzdem.
  let fotos = 0
  if (bilder.length) {
    const pfade = await bilderSpeichern(data.id, bilder)
    if (pfade.length) {
      const { error: e } = await useSupabase().from('bewertungen').update({ bilder: pfade }).eq('id', data.id)
      if (e) {
        console.error('[bewertungen] Fotos nicht vermerkt:', e.message)
        await bilderLoeschen(pfade)
      }
      else fotos = pfade.length
    }
  }

  // Link auf die eigene Adresse, damit er auch lokal und in Vorschauen stimmt.
  const link = `${getRequestURL(event).origin}/bewertungen/freigabe?id=${data.id}&t=${data.freigabe_token}`
  const worauf = BEZUEGE[bezug]
  try {
    const { transport, from, to } = useMailer(event)
    await transport.sendMail({
      from, to,
      subject: `Neue Bewertung (${sterne} von 5 Sternen) von ${name}`,
      text: `${name} hat ${sterne} von 5 Sternen vergeben (${worauf}):\n\n${text}\n\n`
        + (fotos ? `Mit ${fotos} Foto${fotos > 1 ? 's' : ''}, zu sehen über den Link.\n\n` : '')
        + `Freischalten oder löschen:\n${link}\n\n`
        + `Alle Bewertungen in der Verwaltung:\n${getRequestURL(event).origin}/admin/bewertungen\n\n`
        + 'Bis zur Freischaltung ist die Bewertung auf der Seite nicht zu sehen.\n',
    })
  }
  catch (err) {
    // Gespeichert ist sie trotzdem, Louis findet sie im Table Editor.
    console.error('[bewertungen] Mail an OES fehlgeschlagen:', err)
  }
  // Dem Formular sagen, wenn Fotos fehlen: sonst glaubt der Kunde, sie seien dabei.
  return { ok: true, fotosFehlen: bilder.length - fotos }
})
