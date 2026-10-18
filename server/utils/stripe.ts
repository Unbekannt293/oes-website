import Stripe from 'stripe'
import type { H3Event } from 'h3'
import type { Position } from './bestellung'

/**
 * Online-Zahlung ueber die gehostete Bezahlseite von Stripe (Checkout).
 * Kartendaten gehen nie ueber unsere Seite. Welche Zahlungsarten erscheinen
 * (Karte, PayPal, Apple Pay, Google Pay, Klarna ...), stellt Louis im
 * Stripe-Dashboard ein, hier steht bewusst keine Liste.
 *
 * Ablauf: Bestellung wird gespeichert (Geraete reserviert) -> Bezahlseite ->
 * zurueck auf /bestellung/danke. Bezahlt markieren passiert dort UND im
 * Webhook, je nachdem was zuerst kommt; zahlungAbschliessen ist dafuer
 * doppelt aufrufbar. Laeuft die Bezahlseite ab oder bricht der Kunde ab,
 * wird die Buchung storniert, damit der Tag wieder frei ist.
 */
export function useStripe(event: H3Event) {
  const key = useRuntimeConfig(event).stripeSecretKey
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Online-Zahlung ist noch nicht eingerichtet' })
  return new Stripe(key)
}

/** Bezahlseite fuer eine gespeicherte Buchung anlegen, gibt die Stripe-URL zurueck. */
export async function zahlungStarten(event: H3Event, opts: {
  buchungId: string, nummer: string, email: string, positionen: Position[], fahrtkostenCent: number
}) {
  const stripe = useStripe(event)
  const origin = getRequestURL(event).origin
  const posten = [
    ...opts.positionen,
    ...(opts.fahrtkostenCent ? [{ name: 'Fahrtkosten', detail: undefined, menge: 1, einzelpreis_cent: opts.fahrtkostenCent }] : []),
  ].filter(p => p.einzelpreis_cent > 0) // inklusive Posten (0 €) zeigt Stripe nicht

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: 'de',
    customer_email: opts.email,
    client_reference_id: opts.buchungId,
    metadata: { buchung_id: opts.buchungId, nummer: opts.nummer },
    line_items: posten.map(p => ({
      quantity: p.menge,
      price_data: {
        currency: 'eur',
        unit_amount: p.einzelpreis_cent,
        product_data: { name: p.name, ...(p.detail ? { description: p.detail } : {}) },
      },
    })),
    // Kuerzeste erlaubte Frist (30 Min.): so lange bleiben die Geraete reserviert.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${origin}/bestellung/danke?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/kasse?abgebrochen=${opts.buchungId}`,
  })
  if (!session.url) throw createError({ statusCode: 502, statusMessage: 'Bezahlseite konnte nicht erstellt werden' })
  return session.url
}

/**
 * Bezahlte Session verbuchen: bezahlt_am setzen und Mails schicken, aber nur
 * beim ersten Mal (die Bedingung "bezahlt_am is null" macht das sicher, auch
 * wenn Rueckkehr-Seite und Webhook gleichzeitig kommen).
 */
export async function zahlungAbschliessen(event: H3Event, session: Stripe.Checkout.Session) {
  const id = session.metadata?.buchung_id
  if (!id || session.payment_status !== 'paid') return false
  const { data, error } = await useSupabase()
    .from('buchungen')
    .update({ bezahlt_am: new Date().toISOString() })
    .eq('id', id)
    .is('bezahlt_am', null)
    .select('id')
  if (error) throw createError({ statusCode: 502, statusMessage: 'Zahlung konnte nicht verbucht werden' })
  if (data?.length) await bestellMailsSenden(event, id)
  return true
}

/** Nicht bezahlte Buchung freigeben (Bezahlseite abgelaufen oder abgebrochen). */
export async function zahlungVerwerfen(buchungId: string) {
  await useSupabase()
    .from('buchungen')
    .update({ status: 'storniert', notiz: 'Online-Zahlung nicht abgeschlossen' })
    .eq('id', buchungId)
    .eq('zahlungsart', 'online')
    .is('bezahlt_am', null)
}
