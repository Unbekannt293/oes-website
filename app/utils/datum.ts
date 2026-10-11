const kurz = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

/** '2026-12-12' -> "Sa., 12.12.2026". Mittags, damit keine Zeitzone den Tag verschiebt. */
export function formatEventDate(iso: string): string {
  return iso ? kurz.format(new Date(`${iso}T12:00:00`)) : ''
}

/** Heute als ISO-Datum in lokaler Zeit (sv-SE schreibt JJJJ-MM-TT). */
export function todayIso(): string {
  return new Date().toLocaleDateString('sv-SE')
}
