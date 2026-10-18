import { z } from 'zod'

// Rueckkehr von der Bezahlseite (/bestellung/danke?session_id=...): Stand bei
// Stripe nachfragen und eine bezahlte Bestellung sofort verbuchen. So klappt
// es auch ohne Webhook (z. B. lokal); der Webhook verbucht doppelt sicher.
// GET /api/zahlung?session_id=cs_...
export default defineEventHandler(async (event) => {
  const q = z.object({ session_id: z.string().startsWith('cs_').max(255) }).safeParse(getQuery(event))
  if (!q.success) throw createError({ statusCode: 400, statusMessage: 'Ungültige Anfrage' })

  let session
  try {
    session = await useStripe(event).checkout.sessions.retrieve(q.data.session_id)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Zahlung nicht gefunden' })
  }
  const bezahlt = await zahlungAbschliessen(event, session)
  return { nummer: session.metadata?.nummer ?? '', bezahlt, status: session.status }
})
