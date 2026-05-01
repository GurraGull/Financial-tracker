import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;
let _failed = false;

const DEFAULT_URL = 'https://ctayvtfjppuusffakcnm.supabase.co';
const DEFAULT_KEY = 'sb_publishable_3YZiMiapaNUtNC3bUVfn2g_JCiMRb7q';

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (_failed) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? DEFAULT_KEY;
  try {
    if (!_client) _client = createClient(url, key);
    return _client;
  } catch {
    _failed = true;
    return null;
  }
}

export type { SupabaseClient };
