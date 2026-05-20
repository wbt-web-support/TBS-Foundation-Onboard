import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";
import { sendResumeEmail } from "@/lib/email/resend";
import { isOutboundEmailConfigured } from "@/lib/email/smtp";
import { buildResumeUrl, normalizeResumeUrlForEmail } from "@/lib/appUrl";
import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { isSubmissionId } from "@/lib/admin/submissionId";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/admin/clients/[id]/send-reminder
 *  Sends the resume link email to a stuck / in-progress client. */
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
    .select("id, email, resume_token, completed")
    .eq("id", id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Client not found", 404);

  const to = data.email?.trim();
  if (!to) return jsonError("No email address on this submission", 422);

  const resumeUrl = normalizeResumeUrlForEmail(buildResumeUrl(data.resume_token));

  try {
    await sendResumeEmail(to, resumeUrl);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Email send failed", 500);
  }

  return Response.json({ ok: true });
}
