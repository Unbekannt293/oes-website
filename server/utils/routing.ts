import type { H3Event } from 'h3'

/**
 * Entfernung vom Lager zur Lieferadresse ueber openrouteservice (HeiGIT,
 * Heidelberg). An den Dienst geht nur die Adresse, kein Name.
 *
 * Start ist Louis' Lager, Willoeperstrasse 19, Hamburg (laut Brief
 * "nicht anzeigen"): die Koordinaten stehen nur hier auf dem Server.
 */
const LAGER: [number, number] = [10.104454, 53.583833] // [Laenge, Breite]
const ORS = 'https://api.openrouteservice.org'

export interface Lieferadresse { strasse: string, plz: string, ort: string }
export interface Strecke { distanceKm: number, label: string }

function useRoutingKey(event: H3Event) {
  const key = useRuntimeConfig(event).routingApiKey
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Entfernungsberechnung ist noch nicht eingerichtet' })
  return key
}

async function ors<T>(key: string, path: string, init?: { body?: unknown, query?: Record<string, string | number>, timeout?: number }) {
  return $fetch<T>(`${ORS}${path}`, {
    method: init?.body ? 'POST' : 'GET',
    query: init?.query,
    body: init?.body as Record<string, unknown> | undefined,
    headers: { Authorization: key },
    timeout: init?.timeout ?? 10_000,
  })
}

interface GeocodeAntwort { features: { geometry: { coordinates: [number, number] }, properties: { label: string, match_type?: string, layer?: string } }[] }
interface RouteAntwort { routes: { summary: { distance: number } }[] }
interface MatrixAntwort { distances: (number | null)[][] }

/**
 * Strassenkilometer Lager -> Ziel, beides ueber openrouteservice. Zuerst die
 * Matrix-Schnittstelle (eine Zahl, genau was wir brauchen). Die Routen-
 * Schnittstelle hing am 18.10.2026 ueber Stunden, die Matrix lief weiter;
 * die Route bleibt deshalb nur als Ersatz.
 */
async function strassenKm(key: string, ziel: [number, number]): Promise<number | undefined> {
  try {
    const m = await ors<MatrixAntwort>(key, '/v2/matrix/driving-car', {
      body: { locations: [LAGER, ziel], sources: [0], destinations: [1], metrics: ['distance'], units: 'km' },
      timeout: 15_000,
    })
    const km = m.distances[0]?.[0]
    if (typeof km === 'number') return km
  }
  catch (err) {
    console.warn('[routing] Matrix nicht erreichbar, nehme Route:', (err as Error).message)
  }
  const r = await ors<RouteAntwort>(key, '/v2/directions/driving-car', {
    body: { coordinates: [LAGER, ziel], units: 'km' }, timeout: 10_000,
  })
  return r.routes[0]?.summary.distance
}

/**
 * Einfache Strecke Lager -> Adresse in km (auf eine Nachkommastelle).
 * Wird die Adresse nicht gefunden, gibt es 422 statt einer geratenen Strecke.
 */
export async function streckeZu(event: H3Event, a: Lieferadresse): Promise<Strecke> {
  const key = useRoutingKey(event)
  let geo: GeocodeAntwort
  try {
    geo = await ors<GeocodeAntwort>(key, '/geocode/search/structured', {
      query: { address: a.strasse, postalcode: a.plz, locality: a.ort, country: 'DE', size: 1 },
    })
  }
  catch (err) {
    console.error('[routing] Geocoding fehlgeschlagen:', err)
    throw createError({ statusCode: 502, statusMessage: 'Adresse konnte gerade nicht geprüft werden' })
  }
  const treffer = geo.features[0]
  // Nur Hausadressen bzw. Strassen zaehlen, kein "irgendwo in Hamburg".
  if (!treffer || !['address', 'street'].includes(treffer.properties.layer ?? '')) {
    throw createError({ statusCode: 422, statusMessage: 'Adresse nicht gefunden' })
  }

  let km: number | undefined
  try {
    km = await strassenKm(key, treffer.geometry.coordinates)
  }
  catch (err) {
    console.error('[routing] Entfernung fehlgeschlagen:', err)
    throw createError({ statusCode: 502, statusMessage: 'Entfernung konnte gerade nicht berechnet werden' })
  }
  if (km === undefined) throw createError({ statusCode: 422, statusMessage: 'Keine Route gefunden' })
  return { distanceKm: Math.round(km * 10) / 10, label: treffer.properties.label }
}

/**
 * Notloesung fuer die Kasse: Ist openrouteservice nicht erreichbar (kam am
 * 18.10.2026 vor, auch die Adresssuche gab 502), soll niemand am Bestellen
 * gehindert werden. Dann gibt es null und die Fahrtkosten werden "nach
 * Absprache" berechnet. Eine unbekannte Adresse (422) bleibt ein Fehler,
 * die soll der Kunde korrigieren.
 */
export async function streckeOderOffen(event: H3Event, a: Lieferadresse): Promise<Strecke | null> {
  try {
    return await streckeZu(event, a)
  }
  catch (err) {
    if ((err as { statusCode?: number }).statusCode === 422) throw err
    console.warn('[routing] Entfernung offen, Fahrtkosten nach Absprache:', (err as Error).message)
    return null
  }
}
