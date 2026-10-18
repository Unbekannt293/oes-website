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
 * Strassenkilometer Lager -> Ziel. Erst die normale Route; haengt sie (das
 * kam bei openrouteservice schon vor, die Matrix lief dabei weiter), dann
 * dieselbe Strecke ueber die Matrix-Schnittstelle.
 */
async function strassenKm(key: string, ziel: [number, number]): Promise<number | undefined> {
  try {
    const r = await ors<RouteAntwort>(key, '/v2/directions/driving-car', {
      body: { coordinates: [LAGER, ziel], units: 'km' }, timeout: 8_000,
    })
    return r.routes[0]?.summary.distance
  }
  catch (err) {
    console.warn('[routing] Route nicht erreichbar, nehme Matrix:', (err as Error).message)
  }
  const m = await ors<MatrixAntwort>(key, '/v2/matrix/driving-car', {
    body: { locations: [LAGER, ziel], sources: [0], destinations: [1], metrics: ['distance'], units: 'km' },
    timeout: 25_000,
  })
  return m.distances[0]?.[0] ?? undefined
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
