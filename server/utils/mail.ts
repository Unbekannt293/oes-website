import nodemailer from 'nodemailer'
import type { H3Event } from 'h3'

/**
 * Versand ueber Louis' STRATO-Postfach. Absender ist immer das eigene
 * Postfach: nur dafuer signiert STRATO per DKIM. Mit der Adresse des Kunden
 * als Absender wuerde Gmail & Co. die Mail wegen DMARC ablehnen, deshalb
 * steht der Kunde nur im Reply-To.
 */
/**
 * Beim Kopieren aus Webseiten oder Messengern rutschen unsichtbare Zeichen
 * mit (z. B. U+2060). STRATO kennt "⁠kontakt@..." dann nicht und
 * schickt die Mail mit "No such mailbox" zurueck.
 */
function clean(v: unknown) {
  return String(v ?? '').replace(/[​-‍⁠﻿ ]/g, '').trim()
}

export function useMailer(event: H3Event) {
  const raw = useRuntimeConfig(event)
  const cfg = {
    smtpHost: clean(raw.smtpHost),
    smtpUser: clean(raw.smtpUser),
    smtpPass: String(raw.smtpPass ?? ''), // Passwort nie veraendern
    mailTo: clean(raw.mailTo),
  }
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
