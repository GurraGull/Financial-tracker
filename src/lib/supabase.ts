import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://ctayvtfjppuusffakcnm.supabase.co';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0YXl2dGZqcHB1dXNmZmFrY25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDc0ODAsImV4cCI6MjA5MzE4MzQ4MH0.bbE5fxS_PGJIkUIkyvXbL0P-9Is81ygAmq2-0EDzEoI';

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_client) _client = createClient(URL, ANON, {
      auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
    });
    return _client;
  } catch {
    return null;
  }
}

export type { SupabaseClient };
