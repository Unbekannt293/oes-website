/**
 * Schritte im Buchungskasten wie ein Akkordeon: Es ist immer nur ein Schritt
 * offen. Ein Schritt ist erst erreichbar, wenn alle davor fertig sind.
 * Fertige Schritte lassen sich wieder oeffnen, um etwas zu aendern.
 */
export type StepState = 'active' | 'done' | 'todo' | 'locked'

export function useSteps(count: number) {
  /** Offener Schritt, 0 = alle fertig, keiner offen. */
  const active = ref(1)
  const done = ref(new Set<number>())

  const all = Array.from({ length: count }, (_, i) => i + 1)
  const reachable = (n: number) => all.slice(0, n - 1).every(k => done.value.has(k))
  const firstOpen = () => all.find(k => !done.value.has(k)) ?? 0

  function state(n: number): StepState {
    if (active.value === n) return 'active'
    if (done.value.has(n)) return 'done'
    return reachable(n) ? 'todo' : 'locked'
  }

  /** Schritt abschliessen und zum ersten noch offenen springen. */
  function complete(n: number) {
    done.value = new Set(done.value).add(n)
    active.value = firstOpen()
  }

  /** Schritt gilt wieder als offen (z. B. Tag ist nicht mehr frei). */
  function reopen(n: number) {
    const next = new Set(done.value)
    next.delete(n)
    done.value = next
    active.value = n
  }

  function open(n: number) {
    if (reachable(n)) active.value = n
  }

  /** Vorbelegung, z. B. aus der Adresse: zaehlt als fertig, oeffnet nichts. */
  function preset(n: number) {
    done.value = new Set(done.value).add(n)
  }

  const allDone = computed(() => all.every(k => done.value.has(k)))

  return { active, done, state, complete, reopen, open, preset, allDone }
}
