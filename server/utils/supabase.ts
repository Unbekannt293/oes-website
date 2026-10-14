import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Datenbankzugriff fuer den Server. Laeuft mit dem Secret Key, der alle
 * Zugriffsregeln umgeht: darum nur hier im server-Ordner verwenden, nie
 * im Browser-Code. Ohne Schluessel antwortet die Schnittstelle mit 503
 * statt mit einem kryptischen Fehler.
 */
export function useSupabase(): SupabaseClient {
  if (client) return client
  const { supabaseUrl, supabaseSecretKey } = useRuntimeConfig()
  if (!supabaseUrl || !supabaseSecretKey) {
    throw createError({ statusCode: 503, statusMessage: 'Buchungsdatenbank ist nicht eingerichtet' })
  }
  client = createClient(supabaseUrl, supabaseSecretKey, {
    // Kein Login, keine Sitzung: der Server spricht immer als er selbst.
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
