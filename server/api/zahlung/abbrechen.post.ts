import { z } from 'zod'

// Kunde kommt ueber "Zurueck" von der Bezahlseite: offene Bezahlseite sofort
// schliessen und die Reservierung freigeben, sonst waere der Tag bis zum
// Ablauf (30 Min.) blockiert und ein zweiter Versuch scheitert an
// "nicht verfuegbar". Die Buchungs-ID ist eine zufaellige UUID aus der
// Ruecksprung-Adresse; bezahlte Buchungen fasst zahlungVerwerfen nicht an.
// POST /api/zahlung/abbrechen { buchungId }
export default defineEventHandler(async (event) => {
  const b = z.object({ buchungId: z.uuid() }).safeParse(await readBody(event))
  if (!b.success) throw createError({ statusCode: 400, statusMessage: 'Ungültige Anfrage' })

  const stripe = useStripe(event)
  const offen = await stripe.checkout.sessions.list({ status: 'open', limit: 100 })
  for (const s of offen.data.filter(s => s.metadata?.buchung_id === b.data.buchungId)) {
    await stripe.checkout.sessions.expire(s.id)
  }
  await zahlungVerwerfen(b.data.buchungId)
  return { ok: true }
})
