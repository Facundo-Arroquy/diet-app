import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Este cliente usa la SERVICE ROLE KEY — solo se debe usar en el servidor
// Nunca exponer al navegador.

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Copiá .env.example a .env.local y completá los valores.'
    )
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _client
}
