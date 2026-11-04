/**
 * Postgres-daterange wie '[2026-10-24,2026-10-26)' in erste und letzte
 * Tage (einschliesslich) umrechnen. Postgres speichert Tagesbereiche immer
 * mit offenem Ende, der letzte Tag ist also ein Tag vor der Obergrenze.
 */
export function zeitraumLesen(r: string) {
  const [, unten, oben] = r.match(/^[[(]([\d-]+),([\d-]+)[)\]]$/) ?? []
  if (!unten || !oben) throw new Error(`Zeitraum nicht lesbar: ${r}`)
  const bis = new Date(`${oben}T12:00:00Z`)
  if (r.endsWith(')')) bis.setUTCDate(bis.getUTCDate() - 1)
  return { von: unten, bis: bis.toISOString().slice(0, 10) }
}
