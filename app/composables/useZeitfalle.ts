/**
 * Zeitfalle gegen Bots: wie lange ein Formular offen war, bevor es
 * abgeschickt wurde. Der Server weist zu schnelle Absendungen ab
 * (server/utils/bremse.ts, zuSchnell). Zusammen mit UiFalle in jedem
 * oeffentlichen Formular.
 */
export function useZeitfalle() {
  let geoeffnet = 0
  onMounted(() => { geoeffnet = Date.now() })
  return {
    /** Millisekunden seit dem Oeffnen, fuer das Feld "ausfuellzeit". */
    ausfuellzeit: () => Date.now() - geoeffnet,
  }
}
