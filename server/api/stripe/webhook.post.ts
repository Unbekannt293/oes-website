import type Stripe from 'stripe'

// Stripe meldet hier, was mit einer Bezahlseite passiert ist. Die Signatur
// beweist, dass die Nachricht wirklich von Stripe kommt (Webhook-Secret aus
// dem Stripe-Dashboard bzw. "stripe listen", NUXT_STRIPE_WEBHOOK_SECRET).
//  - bezahlt (sofort oder spaeter, z. B. Lastschrift/Klarna): verbuchen + Mails
//  - abgelaufen oder spaete Zahlung gescheitert: Reservierung freigeben
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).stripeWebhookSecret
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Webhook nicht eingerichtet' })

  const body = await readRawBody(event, false)
  const signatur = getHeader(event, 'stripe-signature')
  if (!body || !signatur) throw createError({ statusCode: 400, statusMessage: 'Ungültige Anfrage' })

  let e: Stripe.Event
  try {
    e = useStripe(event).webhooks.constructEvent(body, signatur, secret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Signatur ungültig' })
  }

  switch (e.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await zahlungAbschliessen(event, e.data.object)
      break
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      const id = e.data.object.metadata?.buchung_id
      if (id) await zahlungVerwerfen(id)
      break
    }
  }
  return { received: true }
})
