import { z } from 'zod'

// POST /api/admin/sperren { geraet, anzahl, von, bis, grund }
// Prueft vorher, ob an jedem Tag genug frei ist. Sonst wuerde eine Sperre
// eine bestehende Buchung ueberlagern.
const schema = z.object({
  geraet: z.enum(['fotobox', 'soundbox']),
  anzahl: z.number().int().min(1).max(2),
  von: z.iso.date(),
  bis: z.iso.date(),
  grund: z.string().trim().max(200).optional(),
}).refine(s => s.bis >= s.von, { message: 'Ende vor Beginn', path: ['bis'] })

export default defineEventHandler(async (event) => {
  const s = await readValidatedBody(event, schema.parse)
  const db = useSupabase()
  const { data: tage, error } = await db.rpc('freie_geraete', { p_geraet: s.geraet, p_von: s.von, p_bis: s.bis })
  if (error) throw createError({ statusCode: 502, statusMessage: error.message })
  const knapp = (tage as { tag: string, frei: number }[]).find(t => t.frei < s.anzahl)
  if (knapp) {
    throw createError({ statusCode: 409, statusMessage: `Am ${knapp.tag.split('-').reverse().join('.')} ist dafür nicht genug frei` })
  }
  const { error: e2 } = await db.from('belegungen').insert({
    geraet: s.geraet, anzahl: s.anzahl, zeitraum: `[${s.von},${s.bis}]`, grund: s.grund || null,
  })
  if (e2) throw createError({ statusCode: 502, statusMessage: e2.message })
  return { ok: true }
})
