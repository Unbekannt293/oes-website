import type { CartLine } from '~~/shared/types'
import type { Korbzeile } from '~~/shared/schemas'
import { addons, findPackage, findProduct, LAYOUT_ADDON, soundboxRates } from '~~/shared/catalog'
import { depositCents, packageRangeCents, rentalDays, soundboxRentalCents } from '~~/shared/pricing'

/**
 * Rechnet einen Warenkorb auf dem Server neu: Was der Browser schickt, ist nur
 * die Auswahl (Paket, Soundboxen, Tage, Zubehoer). Alle Preise kommen aus dem
 * Katalog, sonst koennte jemand im Browser seinen eigenen Preis einsetzen.
 * Ungueltiges (unbekanntes Paket, Zubehoer ohne Buchung, Datum in der
 * Vergangenheit) bricht mit 422 ab.
 */
const MAX_TAGE = 31

export interface Position { art: 'paket' | 'produkt' | 'zubehoer', slug: string, name: string, detail?: string, menge: number, einzelpreis_cent: number }
export interface Belegung { geraet: 'fotobox' | 'soundbox', anzahl: number, von: string, bis: string }

export interface Preisberechnung {
  /** Fuer quoteDelivery und die Mails, mit Server-Preisen. */
  lines: CartLine[]
  positionen: Position[]
  belegungen: Belegung[]
  summeCent: number
  kautionCent: number
  von: string
  bis: string
}

function ungueltig(grund: string): never {
  throw createError({ statusCode: 422, statusMessage: `Warenkorb ungültig: ${grund}` })
}

export function korbBerechnen(zeilen: Korbzeile[]): Preisberechnung {
  const heute = new Date().toLocaleDateString('sv-SE')
  const lines: CartLine[] = []
  const positionen: Position[] = []
  const belegungen: Belegung[] = []
  let fotobox = false
  let soundboxen = 0

  const gruppen = new Map<string, Korbzeile[]>()
  for (const z of zeilen) gruppen.set(z.group, [...(gruppen.get(z.group) ?? []), z])

  for (const [group, teile] of gruppen) {
    const haupt = teile.filter(t => t.kind !== 'addon')
    if (haupt.length !== 1) ungueltig('jede Buchung braucht genau eine Hauptposition')
    const h = haupt[0]!
    const tage = rentalDays(h.from, h.to)
    if (h.from < heute || tage < 1 || tage > MAX_TAGE) ungueltig('Zeitraum')
    const tageText = tage > 1 ? `, ${tage} Tage` : ''

    let designInklusive = false
    let mitSoundbox = 0
    if (h.kind === 'package') {
      const pkg = findPackage(h.slug)
      if (!pkg?.available) ungueltig(`Paket ${h.slug}`)
      const sb = h.soundboxes as 0 | 1 | 2
      const preis = packageRangeCents(pkg, sb, h.from, h.to)
      const detail = (sb ? `mit ${sb} Soundbox${sb > 1 ? 'en' : ''}` : 'ohne Soundbox') + tageText
      positionen.push({ art: 'paket', slug: pkg.slug, name: pkg.name, detail, menge: 1, einzelpreis_cent: preis })
      lines.push({ id: crypto.randomUUID(), group, kind: 'package', slug: pkg.slug, name: pkg.name, detail, unitPriceCents: preis, quantity: 1, from: h.from, to: h.to, freeDeliveryKm: pkg.freeDeliveryKm, deposit: { fotobox: true, soundboxes: sb } })
      belegungen.push({ geraet: 'fotobox', anzahl: 1, von: h.from, bis: h.to })
      if (sb) belegungen.push({ geraet: 'soundbox', anzahl: sb, von: h.from, bis: h.to })
      fotobox = true
      soundboxen += sb
      mitSoundbox = sb
      designInklusive = !!pkg.designIncluded
    }
    else if (h.kind === 'product' && h.slug === 'soundbox') {
      const p = findProduct('soundbox')!
      const preis = soundboxRentalCents(h.from, h.to)
      const detail = `${tage} ${tage === 1 ? 'Tag' : 'Tage'}`
      positionen.push({ art: 'produkt', slug: p.slug, name: p.name, detail, menge: h.quantity, einzelpreis_cent: preis })
      lines.push({ id: crypto.randomUUID(), group, kind: 'product', slug: p.slug, name: p.name, detail, unitPriceCents: preis, quantity: h.quantity, from: h.from, to: h.to, freeDeliveryKm: 0, deposit: { fotobox: false, soundboxes: h.quantity } })
      belegungen.push({ geraet: 'soundbox', anzahl: h.quantity, von: h.from, bis: h.to })
      soundboxen += h.quantity
      mitSoundbox = h.quantity
    }
    else {
      ungueltig(`Produkt ${h.slug}`)
    }

    for (const a of teile.filter(t => t.kind === 'addon')) {
      let name: string
      let preis: number
      if (a.slug === 'zusatzakku') {
        if (!mitSoundbox) ungueltig('Zusatzakku ohne Soundbox')
        name = 'Zusatzakku'
        preis = tage * soundboxRates.extraBatteryPerDayCents
      }
      else {
        const addon = addons.find(x => x.slug === a.slug && x.available)
        if (!addon) ungueltig(`Zubehör ${a.slug}`)
        name = addon.name
        // Ab Premium ist das eigene Layout inklusive.
        preis = a.slug === LAYOUT_ADDON && designInklusive ? 0 : addon.priceCents
      }
      positionen.push({ art: 'zubehoer', slug: a.slug, name, menge: 1, einzelpreis_cent: preis })
      lines.push({ id: crypto.randomUUID(), group, kind: 'addon', slug: a.slug, name, unitPriceCents: preis, quantity: 1, from: h.from, to: h.to, freeDeliveryKm: 0 })
    }
  }

  const summeCent = positionen.reduce((s, p) => s + p.einzelpreis_cent * p.menge, 0)
  const von = belegungen.map(b => b.von).sort()[0]!
  const bis = belegungen.map(b => b.bis).sort().at(-1)!
  return { lines, positionen, belegungen, summeCent, kautionCent: depositCents(fotobox, soundboxen), von, bis }
}
