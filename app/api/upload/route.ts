import { isBunnyStorageConfigured, uploadToBunnyStorage } from "@/lib/bunny/storage";
import { getServiceClient, UPLOADS_BUCKET } from "@/lib/supabase/server";
import type { UploadResponse } from "@/lib/types";

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

  const questionId = safeSegment(String(form.get("questionId") ?? "misc"));
  const companyNameRaw = String(form.get("companyName") ?? "");
  const companyFolder = safeSegment(companyNameRaw || "unknown-company");

  const path = `foundation-onboard/${companyFolder}/${Date.now()}-${questionId}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  if (isBunnyStorageConfigured()) {
    try {
      const out = await uploadToBunnyStorage({ relativePath: path, buffer, contentType });
      return Response.json(out satisfies UploadResponse);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      return jsonError(msg, 502);
    }
  }

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
  return Response.json({ path, publicUrl: data.publicUrl } satisfies UploadResponse);
}
