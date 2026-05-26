import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key. This bypasses RLS,
// so it must NEVER be imported into a client component — only into route handlers.
// (RLS stays enabled with no anon policies; the browser's anon key can touch nothing.)

let cachedService: SupabaseClient | null = null;
let cachedAnon: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cachedService) return cachedService;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  cachedService = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedService;
}

/** Anon-key client — use this for user-facing auth (signInWithPassword, etc.).
 *  The service-role client sends its JWT as Authorization which can interfere
 *  with GoTrue password verification. */
export function getAnonClient(): SupabaseClient {
  if (cachedAnon) return cachedAnon;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  cachedAnon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAnon;
}

export const SUBMISSIONS_TABLE = "onboarding_submissions";
export const UPLOADS_BUCKET = "onboarding-uploads";
