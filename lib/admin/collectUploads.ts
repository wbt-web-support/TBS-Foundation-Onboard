import { asStringOrNull, isProvideLaterSentinel } from "@/lib/answers";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import type { Question } from "@/lib/schema/types";
import type { Answers } from "@/lib/types";
import type { ClientDocument } from "./clients";

const FILE_URL_RE = /\.(pdf|png|jpe?g|gif|webp|svg|bmp|docx?|xlsx?)(\?|$)/i;
const UPLOAD_HOST_RE =
  /foundation-onboard|onboarding-uploads|onboarding-pdfs|b-cdn\.net|bunnycdn|supabase\.co\/storage/i;

const SKIP_ANSWER_KEYS = new Set([
  "_foundationSectionQuestionProgress",
  "_foundationCompletionPdfUrl",
  "_adminNotes",
]);

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

export function looksLikeUploadedFile(url: string): boolean {
  if (!isHttpUrl(url) || isProvideLaterSentinel(url)) return false;
  return FILE_URL_RE.test(url) || UPLOAD_HOST_RE.test(url);
}

export function fileKindFromUrl(url: string): ClientDocument["kind"] {
  if (/\.pdf(\?|$)/i.test(url)) return "pdf";
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url)) return "image";
  return "file";
}

function questionTitle(q: Question): string {
  if (q.titleRich?.length) return q.titleRich.map((s) => s.text).join("");
  return q.title;
}

/** Map every file-upload answer id → label/section (admin: ignore visibility). */
function buildUploadQuestionMeta(): Map<string, { sectionName: string; questionLabel: string }> {
  const map = new Map<string, { sectionName: string; questionLabel: string }>();

  for (const section of ONBOARDING_SCHEMA.sections) {
    const sectionName = section.heading ?? section.id;
    for (const q of section.questions) {
      if (q.type === "file") {
        map.set(q.id, { sectionName, questionLabel: questionTitle(q) });
      }
      if (q.galleryUploadCompanionKey) {
        const companion = section.questions.find((x) => x.id === q.galleryUploadCompanionKey);
        map.set(q.galleryUploadCompanionKey, {
          sectionName,
          questionLabel: companion ? questionTitle(companion) : questionTitle(q),
        });
      }
    }
  }

  return map;
}

const UPLOAD_META = buildUploadQuestionMeta();

/** Walk entire DB `answers` JSON — legacy export, app state, and nested groups. */
function findUploadUrlsInStored(stored: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  function add(url: string) {
    const t = url.trim();
    if (!looksLikeUploadedFile(t) || seen.has(t)) return;
    seen.add(t);
    urls.push(t);
  }

  function walk(value: unknown) {
    if (typeof value === "string") {
      add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;

    const o = value as Record<string, unknown>;

    // Legacy export: { Question: "...", Answer: "https://..." }
    if (typeof o.Question === "string" && o.Answer != null) {
      if (typeof o.Answer === "string") add(o.Answer);
      else if (typeof o.Answer === "object" && !Array.isArray(o.Answer)) {
        for (const v of Object.values(o.Answer as Record<string, unknown>)) {
          if (typeof v === "string") add(v);
        }
      }
    }

    if ("open" in o && "close" in o) return;

    for (const [k, v] of Object.entries(o)) {
      if (SKIP_ANSWER_KEYS.has(k)) continue;
      walk(v);
    }
  }

  walk(stored);
  return urls;
}

/** Attach schema labels where the URL is stored on a known question id. */
function metaForUrl(url: string, appAnswers: Answers): Pick<ClientDocument, "sectionName" | "questionId" | "questionLabel"> {
  for (const [questionId, meta] of UPLOAD_META) {
    const v = appAnswers[questionId];
    if (typeof v === "string" && v.trim() === url) {
      return { sectionName: meta.sectionName, questionId, questionLabel: meta.questionLabel };
    }
  }
  return { sectionName: null, questionId: null, questionLabel: null };
}

export function collectUploadDocuments(params: {
  stored: Record<string, unknown>;
  appAnswers: Answers;
  extraDocs?: ClientDocument[];
}): ClientDocument[] {
  const { stored, appAnswers, extraDocs = [] } = params;
  const docs: ClientDocument[] = [...extraDocs];
  const seen = new Set(docs.map((d) => d.url));
  let n = docs.length;

  for (const url of findUploadUrlsInStored(stored)) {
    if (seen.has(url)) continue;
    seen.add(url);
    n += 1;
    const meta = metaForUrl(url, appAnswers);
    const filename = url.split("/").pop()?.split("?")[0] ?? "Upload";
    docs.push({
      id: `upload-${n}`,
      label: meta.questionLabel ?? filename,
      url,
      kind: fileKindFromUrl(url),
      sectionName: meta.sectionName,
      questionId: meta.questionId,
      questionLabel: meta.questionLabel ?? filename,
    });
  }

  return docs;
}
