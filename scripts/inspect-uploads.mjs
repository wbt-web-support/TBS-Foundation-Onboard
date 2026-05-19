import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = {};
readFileSync(".env.local", "utf8")
  .split("\n")
  .forEach((l) => {
    const t = l.trim();
    if (!t || t.startsWith("#")) return;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  });

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb
  .from("onboarding_submissions")
  .select("id, answers")
  .order("updated_at", { ascending: false })
  .limit(5);

function findUrls(obj, out = []) {
  if (typeof obj === "string") {
    if (/^https?:\/\//i.test(obj)) out.push(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((x) => findUrls(x, out));
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) findUrls(v, out);
  }
  return out;
}

for (const row of data ?? []) {
  const urls = findUrls(row.answers);
  const bunny = urls.filter((u) => /b-cdn|bunny|foundation-onboard/i.test(u));
  console.log("\n---", row.id, "---");
  console.log("total urls", urls.length, "bunny-like", bunny.length);
  bunny.slice(0, 8).forEach((u) => console.log(" ", u));
}
