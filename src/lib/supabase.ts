import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Real Supabase client — the same shared backend as the GuardianX
 * website. Uses only the public anon key (safe for the browser by
 * Supabase's own design; real security comes from RLS on the tables
 * themselves, not from hiding this value). No service-role key is
 * ever referenced anywhere in this project.
 *
 * Returns null (never throws) when the env vars aren't configured —
 * every caller must handle that as "not connected yet," never crash.
 */

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cachedClient;
}
