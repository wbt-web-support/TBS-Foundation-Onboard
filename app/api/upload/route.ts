import { getServiceClient, UPLOADS_BUCKET } from "@/lib/supabase/server";
import type { UploadResponse } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "file";
}
function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 64) || "x";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

// POST /api/upload — multipart form: file, questionId, submissionId(optional).
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

  const questionId = safeSegment(String(form.get("questionId") ?? "misc"));
  const submissionIdRaw = String(form.get("submissionId") ?? "");
  const submissionId = UUID_RE.test(submissionIdRaw) ? submissionIdRaw : "anonymous";

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const path = `submissions/${submissionId}/${questionId}/${Date.now()}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return jsonError(error.message, 500);

  const { data } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(path);
  return Response.json({ path, publicUrl: data.publicUrl } satisfies UploadResponse);
}
