import { isBunnyStorageConfigured, uploadToBunnyStorage } from "@/lib/bunny/storage";
import { FOUNDATION_APP_ANSWERS_KEY } from "@/lib/submission/foundationAppAnswersKey";
import { getServiceClient, SUBMISSIONS_TABLE, UPLOADS_BUCKET } from "@/lib/supabase/server";
import type { UploadResponse } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const ALLOWED_EXT = /\.(jpe?g|png|pdf|docx?)$/i;

function isAllowedUpload(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (ALLOWED_MIME.has(type)) return true;
  return ALLOWED_EXT.test(file.name);
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "file";
}
function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 64) || "x";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Fire-and-forget: persist the uploaded URL into the submission's app answers immediately
 *  so it is never lost if the client-side auto-save doesn't complete. */
async function persistUrlToSubmission(submissionId: string, questionId: string, url: string): Promise<void> {
  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return;
  }

  const { data } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("answers")
    .eq("id", submissionId)
    .maybeSingle();

  if (!data) return;

  const stored = (data.answers ?? {}) as Record<string, unknown>;
  const appAnswers = ((stored[FOUNDATION_APP_ANSWERS_KEY] ?? {}) as Record<string, unknown>);
  appAnswers[questionId] = url;
  stored[FOUNDATION_APP_ANSWERS_KEY] = appAnswers;

  await supabase.from(SUBMISSIONS_TABLE).update({ answers: stored }).eq("id", submissionId);
}

// POST /api/upload — multipart form: file, questionId, submissionId(optional).
// Uses Bunny.net Storage when BUNNY_* env is set; otherwise Supabase Storage.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart/form-data", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Missing file", 400);
  if (file.size === 0) return jsonError("Empty file", 400);
  if (file.size > MAX_BYTES) return jsonError("File too large (max 25 MB)", 413);
  if (!isAllowedUpload(file)) {
    return jsonError("Allowed types: JPEG, PNG, PDF, DOC, DOCX", 415);
  }

  const questionId = safeSegment(String(form.get("questionId") ?? "misc"));
  const companyNameRaw = String(form.get("companyName") ?? "");
  const companyFolder = safeSegment(companyNameRaw || "unknown-company");
  const submissionIdRaw = String(form.get("submissionId") ?? "");
  const submissionId = UUID_RE.test(submissionIdRaw) ? submissionIdRaw : null;

  const path = `foundation-onboard/${companyFolder}/${Date.now()}-${questionId}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  let result: UploadResponse;

  if (isBunnyStorageConfigured()) {
    try {
      result = await uploadToBunnyStorage({ relativePath: path, buffer, contentType });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      return jsonError(msg, 502);
    }
  } else {
    let supabase;
    try {
      supabase = getServiceClient();
    } catch {
      return jsonError("Supabase not configured (set Bunny or Supabase env)", 503);
    }

    const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (error) return jsonError(error.message, 500);

    const { data } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(path);
    result = { path, publicUrl: data.publicUrl };
  }

  if (submissionId) {
    const urlToSave = result.publicUrl || result.path;
    void persistUrlToSubmission(submissionId, questionId, urlToSave).catch((err) => {
      console.error("[upload-persist-url]", err);
    });
  }

  return Response.json(result satisfies UploadResponse);
}
