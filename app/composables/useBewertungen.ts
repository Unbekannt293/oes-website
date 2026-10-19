import { type Bewertung, type Bezug, type Thema, themaVon } from '~~/shared/bewertungen'

/**
 * Freigegebene Bewertungen, einmal pro Seite geladen und von allen
 * Bewertungs-Bausteinen geteilt (gleicher key). Schon auf dem Server
 * gerendert, damit die Sterne ohne Nachladen dastehen. Fehlt die Tabelle
 * noch oder ist die Datenbank weg, bleibt die Liste leer statt Fehlerseite.
 */
export function useBewertungen() {
  const { data, refresh } = useFetch<Bewertung[]>('/api/bewertungen', {
    key: 'bewertungen',
    default: () => [],
  })
  const alle = computed(() => data.value ?? [])
  const fuer = (bezug: MaybeRefOrGetter<Bezug>) => computed(() => alle.value.filter(b => b.bezug === toValue(bezug)))
  const zumThema = (thema: MaybeRefOrGetter<Thema | null>) => computed(() => {
    const t = toValue(thema)
    return t ? alle.value.filter(b => themaVon(b.bezug) === t) : alle.value
  })
  return { alle, fuer, zumThema, refresh }
}

/**
 * Ein Popup fuer alle Bausteine einer Seite (Aufbau aus Louis' Entwurf:
 * links alle Bewertungen, rechts "Eigene Bewertung schreiben").
 * thema: Filter der Liste (null = alle). bezug: Vorauswahl im Formular.
 * schreiben: auf dem Handy direkt zum Formular statt zur Liste.
 */
interface DialogZustand { offen: boolean, thema: Thema | null, bezug: Bezug | null, schreiben: boolean }

export function useBewertungDialog() {
  const zustand = useState<DialogZustand>('bewertung-dialog', () => ({ offen: false, thema: null, bezug: null, schreiben: false }))
  function oeffnen(o: { thema?: Thema | null, bezug?: Bezug | null, schreiben?: boolean } = {}) {
    zustand.value = {
      offen: true,
      bezug: o.bezug ?? null,
      thema: o.thema !== undefined ? o.thema : (o.bezug ? themaVon(o.bezug) : null),
      schreiben: o.schreiben ?? false,
    }
  }
  return { zustand, oeffnen }
}
