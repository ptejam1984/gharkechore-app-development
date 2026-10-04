import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-only client authenticated with the service role key. Never import this from client components.
export function createAdminClient() {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
