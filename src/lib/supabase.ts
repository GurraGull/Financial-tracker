import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Only initialise when a proper JWT anon key is provided (starts with eyJ)
  if (!url || !key || !key.startsWith('eyJ')) return null;
  try {
    if (!_client) _client = createClient(url, key);
    return _client;
  } catch {
    return null;
  }
}

export type { SupabaseClient };
