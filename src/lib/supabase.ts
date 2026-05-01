import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

const DEFAULT_URL = 'https://ctayvtfjppuusffakcnm.supabase.co';
const DEFAULT_KEY = 'sb_publishable_3YZiMiapaNUtNC3bUVfn2g_JCiMRb7q';

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_KEY;
  if (!_client) _client = createClient(url, key);
  return _client;
}

export type { SupabaseClient };
