import { z } from 'zod'

/**
 * Dasselbe Schema validiert im Browser und auf dem Server.
 * Clientseitige Prüfung ist Komfort, serverseitige ist die echte Hürde.
 */
export const anfrageSchema = z.object({
  vorname:  z.string().trim().min(2, 'Bitte Vornamen angeben').max(80),
  nachname: z.string().trim().min(2, 'Bitte Nachnamen angeben').max(80),
  email:    z.email('Bitte gültige E-Mail-Adresse angeben').max(160),
  telefon:  z.string().trim().min(6, 'Bitte Telefonnummer angeben').max(40),
  eventDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte Datum wählen'),
  nachricht: z.string().trim().min(10, 'Bitte kurz beschreiben, worum es geht').max(4000),
  /** Muss leer bleiben. Bots fuellen es aus. */
  website: z.string().max(0).optional(),
  datenschutz: z.literal(true, {
    message: 'Bitte der Datenschutzerklärung zustimmen',
  }),
})

export type AnfrageInput = z.infer<typeof anfrageSchema>
