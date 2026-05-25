/**
 * Diagnose admin login: Supabase Auth + app_users table.
 * Run: node scripts/check-auth.mjs
 */
import { createClient } from "@supabase/supabase-js";
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

// Check app_users table
const { data, error } = await supabase
  .from("app_users")
  .select("id, email, role")
  .eq("role", "admin");

if (error) {
  console.error("\nDatabase error:", error.message);
  if (error.code === "42P01") {
    console.error("\n>>> Table app_users does NOT exist.");
    console.error(">>> Run supabase/migrations/0003_app_users.sql in Supabase SQL Editor.\n");
  }
  process.exit(1);
}

if (!data || data.length === 0) {
  console.error("\n>>> No admin users found in app_users table.");
  console.error(">>> Insert a row with role='admin' matching the email in Supabase Auth.\n");
  process.exit(1);
}

console.log(`\nAdmin users in app_users (${data.length}):`);
for (const u of data) {
  console.log(`  - ${u.email} (id: ${u.id})`);
}

// Check Supabase Auth users
const { data: authList, error: authErr } = await supabase.auth.admin.listUsers();
if (authErr) {
  console.error("\nCould not list Supabase Auth users:", authErr.message);
} else {
  const authEmails = new Set(authList.users.map((u) => u.email?.toLowerCase()));
  console.log("\nSupabase Auth check:");
  for (const u of data) {
    const inAuth = authEmails.has(u.email.toLowerCase());
    console.log(`  ${u.email}: ${inAuth ? "EXISTS in Supabase Auth" : "MISSING from Supabase Auth — create via Authentication > Users > Add user"}`);
  }
}
