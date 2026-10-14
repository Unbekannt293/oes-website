import nodemailer from 'nodemailer'
import type { H3Event } from 'h3'

/**
 * Versand ueber Louis' STRATO-Postfach. Absender ist immer das eigene
 * Postfach: nur dafuer signiert STRATO per DKIM. Mit der Adresse des Kunden
 * als Absender wuerde Gmail & Co. die Mail wegen DMARC ablehnen, deshalb
 * steht der Kunde nur im Reply-To.
 */
export function useMailer(event: H3Event) {
  const cfg = useRuntimeConfig(event)
  if (!cfg.smtpHost || !cfg.smtpUser || !cfg.smtpPass || !cfg.mailTo) {
    throw createError({ statusCode: 503, statusMessage: 'Mailversand ist noch nicht eingerichtet' })
  }

  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: 465,
    secure: true, // STRATO: SSL ab Verbindungsbeginn, kein STARTTLS
    auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
  })

  return {
    transport,
    from: { name: 'Otto\'s Event Service', address: cfg.smtpUser },
    to: cfg.mailTo,
  }
}

/** Nutzereingaben fuer den HTML-Teil der Mail entschaerfen. */
export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c]!)
}
