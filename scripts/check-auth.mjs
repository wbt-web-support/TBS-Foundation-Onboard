/**
 * Diagnose admin login: Supabase app_users table + password hash.
 * Run: node scripts/check-auth.mjs
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envText = readFileSync(envPath, "utf8");
const env = {};
for (const line of envText.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const jwt = env.JWT_SECRET;

console.log("JWT_SECRET set:", Boolean(jwt && jwt.length >= 16));
console.log("Supabase URL set:", Boolean(url));
console.log("Service role key set:", Boolean(key));

if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("app_users")
  .select("id, email, role, password_hash")
  .eq("email", "example@gmail.com")
  .maybeSingle();

if (error) {
  console.error("\nDatabase error:", error.message);
  if (error.code === "42P01") {
    console.error("\n>>> Table app_users does NOT exist.");
    console.error(">>> Run supabase/migrations/0003_app_users.sql in Supabase SQL Editor.\n");
  }
  process.exit(1);
}

if (!data) {
  console.error("\n>>> No user found for example@gmail.com");
  console.error(">>> Run supabase/migrations/0003_app_users.sql in Supabase SQL Editor.\n");
  process.exit(1);
}

console.log("\nUser found:", { id: data.id, email: data.email, role: data.role });

const testPassword = "Rainbow12345*";
const ok = await bcrypt.compare(testPassword, data.password_hash);
console.log(`Password "${testPassword}" matches hash:`, ok);

if (!ok) {
  console.log("\n>>> Hash in DB does not match Rainbow12345*");
  console.log(">>> Will generate new hash for fix SQL below.\n");
  const hash = await bcrypt.hash(testPassword, 12);
  console.log("-- Run in Supabase SQL Editor:");
  console.log(`UPDATE public.app_users SET password_hash = '${hash}' WHERE email = 'example@gmail.com';`);
}
