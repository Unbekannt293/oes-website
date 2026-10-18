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

/** Lieferadresse an der Kasse. */
export const lieferadresseSchema = z.object({
  strasse: z.string().trim().min(3, 'Bitte Straße und Hausnummer angeben').max(120)
    .regex(/\d/, 'Bitte auch die Hausnummer angeben'),
  plz: z.string().trim().regex(/^\d{5}$/, 'Bitte fünfstellige PLZ angeben'),
  ort: z.string().trim().min(2, 'Bitte Ort angeben').max(80),
  zusatz: z.string().trim().max(200).optional(),
})

/** Kontaktdaten an der Kasse. */
export const kontaktSchema = z.object({
  vorname: z.string().trim().min(2, 'Bitte Vornamen angeben').max(80),
  nachname: z.string().trim().min(2, 'Bitte Nachnamen angeben').max(80),
  email: z.email('Bitte gültige E-Mail-Adresse angeben').max(160),
  telefon: z.string().trim().min(6, 'Bitte Telefonnummer angeben').max(40),
})

/**
 * Eine Warenkorbzeile, wie sie an den Server geht. Preise schickt der
 * Browser bewusst nicht mit: der Server rechnet sie selbst aus dem Katalog.
 */
export const korbzeileSchema = z.object({
  group: z.string().min(1).max(64),
  kind: z.enum(['package', 'product', 'addon']),
  slug: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(2),
  from: z.iso.date(),
  to: z.iso.date(),
  soundboxes: z.number().int().min(0).max(2).default(0),
})

export const lieferungAnfrageSchema = lieferadresseSchema.extend({
  zeilen: z.array(korbzeileSchema).min(1).max(30),
})

export const bestellungSchema = z.object({
  adresse: lieferadresseSchema,
  kontakt: kontaktSchema,
  zahlungsart: z.enum(['ueberweisung', 'online']),
  zeilen: z.array(korbzeileSchema).min(1).max(30),
  mietvertrag: z.literal(true, { message: 'Bitte dem Mietvertrag zustimmen' }),
})

export type Bestellung = z.infer<typeof bestellungSchema>
export type Korbzeile = z.infer<typeof korbzeileSchema>
