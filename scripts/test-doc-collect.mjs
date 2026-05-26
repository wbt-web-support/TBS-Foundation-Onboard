import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// dynamic import won't work for ts - test logic inline
const FILE_URL_RE = /\.(pdf|png|jpe?g|gif|webp|svg|docx?|xlsx?)(\?|$)/i;
const UPLOAD_PATH_RE = /foundation-onboard|onboarding-uploads|onboarding-pdfs|b-cdn\.net|bunnycdn/i;

function looksLikeUploadedFile(url) {
  return FILE_URL_RE.test(url) || UPLOAD_PATH_RE.test(url);
}

function findUrls(obj, out = []) {
  if (typeof obj === "string") {
    if (/^https?:\/\//i.test(obj) && looksLikeUploadedFile(obj)) out.push(obj);
    return out;
  }
  if (Array.isArray(obj)) obj.forEach((x) => findUrls(x, out));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_foundation")) continue;
      findUrls(v, out);
    }
  }
  return out;
}

const env = {};
readFileSync(".env.local", "utf8").split("\n").forEach((l) => {
  const t = l.trim();
  if (!t || t.startsWith("#")) return;
  const i = t.indexOf("=");
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb
  .from("onboarding_submissions")
  .select("answers")
  .eq("id", "b7a9c79e-5b2a-48e2-9173-b763a3101379")
  .single();

const stored = data.answers;
const inner = stored._foundationOnboardAnswers ?? stored;
const urls = findUrls(inner);
console.log("from inner app answers", urls.length, urls);

// walk full stored including legacy
const all = findUrls(stored);
console.log("from full stored", all.length, all);
