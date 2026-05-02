import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/config'

export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  if (!publicEnv.supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  return createClient(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}
