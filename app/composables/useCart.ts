import type { CartLine } from '~~/shared/types'
import { depositCents, subtotalCents } from '~~/shared/pricing'

export const CART_STORAGE_KEY = 'oes-warenkorb'

/**
 * Warenkorb fuer die ganze Seite. Der Zustand lebt in useState, damit Header,
 * Produktseite und Warenkorb denselben Stand sehen. Gespeichert wird im
 * localStorage des Besuchers; das Laden passiert erst nach dem Hydrieren
 * (plugins/cart.client.ts), sonst rendert der Server "0 Artikel" und der
 * Browser "2 Artikel" und Vue meldet einen Hydrierungsfehler.
 */
export function useCart() {
  const lines = useState<CartLine[]>('cart', () => [])
  /** Erst true, wenn der gespeicherte Korb geladen ist. Vorher nicht "leer" anzeigen. */
  const loaded = useState('cart-loaded', () => false)

  /** Gebuchte Positionen (Zubehoer zaehlt nicht extra). */
  const count = computed(() =>
    lines.value.filter(l => l.kind !== 'addon').reduce((n, l) => n + l.quantity, 0))

  const subtotal = computed(() => subtotalCents(lines.value))

  /** Kaution ueber den ganzen Korb, mit Louis' Obergrenze. */
  const deposit = computed(() => {
    const fotobox = lines.value.some(l => l.deposit?.fotobox)
    const soundboxes = lines.value.reduce((n, l) => n + (l.deposit?.soundboxes ?? 0), 0)
    return lines.value.length ? depositCents(fotobox, soundboxes) : 0
  })

  function add(newLines: Omit<CartLine, 'id' | 'group'>[]) {
    const group = crypto.randomUUID()
    lines.value = [...lines.value, ...newLines.map(l => ({ ...l, id: crypto.randomUUID(), group }))]
  }

  /** Entfernt eine Zeile. Ist es die Hauptposition, geht ihr Zubehoer mit. */
  function remove(id: string) {
    const line = lines.value.find(l => l.id === id)
    if (!line) return
    lines.value = line.kind === 'addon'
      ? lines.value.filter(l => l.id !== id)
      : lines.value.filter(l => l.group !== line.group)
  }

  function clear() {
    lines.value = []
  }

  return { lines, loaded, count, subtotal, deposit, add, remove, clear }
}
