import { heuteBerlin, type PreisRegel, preiseAnwenden } from '~~/shared/preise'

// Preise im Browser auf denselben Stand bringen wie auf dem Server
// (server/middleware/preise.ts). Laeuft vor allen anderen Plugins, damit
// Warenkorb und Buchungskasten schon mit den richtigen Werten rechnen.
export default defineNuxtPlugin(() => {
  const regeln = useState<PreisRegel[]>('preis-regeln', () =>
    import.meta.server ? (useRequestEvent()?.context.preisRegeln ?? []) : [])
  preiseAnwenden(regeln.value, heuteBerlin())
})
