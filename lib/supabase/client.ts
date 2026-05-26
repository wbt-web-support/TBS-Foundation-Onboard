import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser Supabase client (anon key). Currently unused — all reads/writes go
// through route handlers with the service-role key — but kept for future
// client-side needs (e.g. realtime). Returns null if env isn't configured.

let cached: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  cached = createClient(url, anonKey, { auth: { persistSession: false } });
  return cached;
}
