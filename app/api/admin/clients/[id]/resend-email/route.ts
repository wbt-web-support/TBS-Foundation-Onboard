import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";
import { sendCompletionReportWithPdf } from "@/lib/email/resend";
import { getBunnyCompletionPdfUrl } from "@/lib/admin/completionPdf";
import { buildOnboardingAnswersPdfBuffer } from "@/lib/pdf/onboardingAnswersPdf";
import { extractAppAnswersFromDatabase } from "@/lib/submission/persistAnswers";
import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { isSubmissionId } from "@/lib/admin/submissionId";
import { isOutboundEmailConfigured } from "@/lib/email/smtp";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/admin/clients/[id]/resend-email
 *  Re-sends the completion email with PDF to the client. */
export async function POST(request: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const { id } = await ctx.params;
  if (!isSubmissionId(id)) return jsonError("Invalid submission id", 400);

  if (!isOutboundEmailConfigured()) return jsonError("Email is not configured on this server", 503);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("id, email, answers")
    .eq("id", id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Client not found", 404);

  const stored = (data.answers ?? {}) as Record<string, unknown>;
  const appAnswers = extractAppAnswersFromDatabase(stored);
  const pdfPublicUrl = getBunnyCompletionPdfUrl(stored) ?? null;

  const to = data.email?.trim();
  if (!to) return jsonError("No email address on this submission", 422);

  try {
    const pdfBuffer = await buildOnboardingAnswersPdfBuffer(appAnswers);
    await sendCompletionReportWithPdf(to, appAnswers, pdfBuffer, pdfPublicUrl);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Email send failed", 500);
  }

  return Response.json({ ok: true });
}
