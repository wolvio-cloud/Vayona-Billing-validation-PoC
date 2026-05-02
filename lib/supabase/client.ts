'use client'

import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/config'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
  }
  return _client
}
