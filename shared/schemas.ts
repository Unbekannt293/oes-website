import { z } from 'zod'
import { BEZUG_KEYS, BILD_MAX_BYTES, BILDER_MAX } from './bewertungen'
import { ANLASS_KEYS, LAYOUT_IDS, layoutFehler, LOGO_MAX_BYTES } from './buchung'

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
  /** Honeypot. Ausgefuellt = Bot, der Server antwortet dann "ok" und schickt nichts. */
  website: z.string().max(200).optional(),
  /** Zeitfalle: ms seit dem Oeffnen des Formulars (server/utils/bremse.ts). */
  ausfuellzeit: z.number().int().nonnegative().optional(),
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

/** Firmenkunde: Name fuer Rechnung, USt-IdNr. freiwillig. */
export const firmaSchema = z.object({
  name: z.string().trim().min(2, 'Bitte den Firmennamen angeben').max(120),
  ustId: z.string().trim().max(20).optional(),
})

/** Veranstaltung: Anlass, bei "Sonstiges" mit eigenem Text. */
export const veranstaltungSchema = z.object({
  anlass: z.enum(ANLASS_KEYS, { message: 'Bitte den Anlass wählen' }),
  anlassText: z.string().trim().max(80).optional(),
}).refine(v => v.anlass !== 'sonstiges' || (v.anlassText?.length ?? 0) >= 2, {
  message: 'Bitte kurz beschreiben, was gefeiert wird', path: ['anlassText'],
})

export const bestellungSchema = z.object({
  adresse: lieferadresseSchema,
  kontakt: kontaktSchema,
  /** Privat oder Firma (Louis, 11.11.2026). Firma: Name auf der Rechnung, kein Verbraucher-Widerruf. */
  kundenart: z.enum(['privat', 'firma']).default('privat'),
  firma: firmaSchema.optional(),
  veranstaltung: veranstaltungSchema,
  /** Gewaehlte Fotolayouts, nur mit Layout-Zubehoer bzw. Paket mit Layout (Server prueft). */
  layouts: z.array(z.enum(LAYOUT_IDS)).max(LAYOUT_IDS.length).default([]),
  /** Logo fuer das Layout als Data-URL, Inhalt prueft der Server. */
  logo: z.string().regex(/^data:(image\/(png|jpeg|webp|svg\+xml)|application\/pdf);base64,/).max(Math.ceil(LOGO_MAX_BYTES * 4 / 3) + 40).optional(),
  /** Verbraucher: ausdruecklich zugestimmt, dass OES vor Ablauf der Widerrufsfrist beginnt. */
  widerrufZustimmung: z.boolean().default(false),
  zahlungsart: z.enum(['ueberweisung', 'online']),
  /** Fotobox immer Lieferung, Soundbox allein auch Selbstabholung (Mietbedingungen § 9). */
  uebergabe: z.enum(['lieferung', 'abholung']).default('lieferung'),
  /** Kaution nie online, nur bar bei Uebergabe oder per Ueberweisung vorab. */
  kaution: z.enum(['bar', 'ueberweisung']).default('bar'),
  zeilen: z.array(korbzeileSchema).min(1).max(30),
  mietvertrag: z.literal(true, { message: 'Bitte dem Mietvertrag zustimmen' }),
}).superRefine((b, ctx) => {
  if (b.kundenart === 'firma' && !b.firma) ctx.addIssue({ code: 'custom', path: ['firma'], message: 'Bitte den Firmennamen angeben' })
  if (b.kundenart === 'privat' && !b.widerrufZustimmung) {
    ctx.addIssue({ code: 'custom', path: ['widerrufZustimmung'], message: 'Bitte der Ausführung vor Ablauf der Widerrufsfrist zustimmen' })
  }
  if (b.layouts.length) {
    const f = layoutFehler(b.layouts)
    if (f) ctx.addIssue({ code: 'custom', path: ['layouts'], message: f })
  }
})

export type Bestellung = z.infer<typeof bestellungSchema>
export type Korbzeile = z.infer<typeof korbzeileSchema>

/** Neue Bewertung. Grenzen wie die Checks in der Datenbank (bewertungen). */
export const bewertungSchema = z.object({
  name: z.string().trim().min(2, 'Bitte Ihren Namen angeben').max(60),
  sterne: z.number({ message: 'Bitte Sterne vergeben' }).int().min(1, 'Bitte Sterne vergeben').max(5),
  text: z.string().trim().min(10, 'Bitte ein paar Worte mehr').max(1000, 'Bitte höchstens 1000 Zeichen'),
  // Seit 11.11.2026 immer ein Produkt, "OES allgemein" gibt es nicht mehr (Louis).
  bezug: z.enum(BEZUG_KEYS, { message: 'Bitte das gemietete Produkt wählen' }),
  /** Honeypot. Ausgefuellt = Bot, der Server antwortet dann "ok" und speichert nichts. */
  website: z.string().max(200).optional(),
  /** Zeitfalle: ms seit dem Oeffnen des Formulars (server/utils/bremse.ts). */
  ausfuellzeit: z.number().int().nonnegative().optional(),
  einwilligung: z.literal(true, { message: 'Bitte der Veröffentlichung zustimmen' }),
  /** Fotos als JPEG-Data-URL, im Browser schon verkleinert. Der Server prueft den Inhalt. */
  bilder: z.array(z.string().startsWith('data:image/jpeg;base64,').max(Math.ceil(BILD_MAX_BYTES * 4 / 3) + 40))
    .max(BILDER_MAX, `Höchstens ${BILDER_MAX} Fotos`).default([]),
})

export type BewertungInput = z.infer<typeof bewertungSchema>

/** Freigabe-Link aus Louis' Mail. */
export const freigabeSchema = z.object({
  id: z.uuid(),
  t: z.uuid(),
})
