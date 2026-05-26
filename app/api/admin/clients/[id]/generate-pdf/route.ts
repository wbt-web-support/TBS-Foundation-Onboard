import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";
import { buildAndUploadCompletionPdf } from "@/lib/pdf/saveCompletionPdf";
import { FOUNDATION_COMPLETION_PDF_URL_KEY } from "@/lib/submission/foundationAppAnswersKey";
import { extractAppAnswersFromDatabase } from "@/lib/submission/persistAnswers";
import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { isSubmissionId } from "@/lib/admin/submissionId";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/admin/clients/[id]/generate-pdf
 *  Generates the submission PDF, uploads it to Bunny (if configured), saves the URL and bytes. */
export async function POST(request: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const { id } = await ctx.params;
  if (!isSubmissionId(id)) return jsonError("Invalid submission id", 400);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("id, answers")
    .eq("id", id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Client not found", 404);

  const stored = (data.answers ?? {}) as Record<string, unknown>;
  const appAnswers = extractAppAnswersFromDatabase(stored);

  let buffer: Buffer;
  let filename: string;
  let publicUrl: string | null;

  try {
    ({ buffer, filename, publicUrl } = await buildAndUploadCompletionPdf(appAnswers, id));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "PDF generation failed", 500);
  }

  const patch: Record<string, unknown> = {
    completion_pdf: `\\x${buffer.toString("hex")}`,
    completion_pdf_filename: filename,
  };

  if (publicUrl) {
    const updatedStored = { ...stored, [FOUNDATION_COMPLETION_PDF_URL_KEY]: publicUrl };
    patch.answers = updatedStored;
  }

  const { error: saveErr } = await supabase
    .from(SUBMISSIONS_TABLE)
    .update(patch)
    .eq("id", id);

  if (saveErr) return jsonError(saveErr.message, 500);

  return Response.json({ ok: true, pdfUrl: publicUrl, filename });
}
