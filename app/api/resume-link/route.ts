import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { applicantBusinessEmail } from "@/lib/email/applicantBusinessEmail";
import { sendResumeEmail } from "@/lib/email/resend";
import { extractAppAnswersFromDatabase } from "@/lib/submission/persistAnswers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

// POST /api/resume-link — body { submissionId }. Emails the magic-link to the
// submission's email address (if one has been captured).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { submissionId?: string } | null;
  const submissionId = body?.submissionId;
  if (!submissionId || !UUID_RE.test(submissionId)) return jsonError("Invalid submissionId", 400);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("resume_token, email, answers")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Submission not found", 404);

  const appAnswers = extractAppAnswersFromDatabase(data.answers ?? {});
  const fromForm = applicantBusinessEmail(appAnswers);
  const recipient =
    fromForm && EMAIL_RE.test(fromForm) ? fromForm : typeof data.email === "string" ? data.email.trim() : "";
  if (!recipient || !EMAIL_RE.test(recipient)) return jsonError("No email on submission yet", 400);

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const link = `${base}/?token=${encodeURIComponent(data.resume_token)}`;

  try {
    await sendResumeEmail(recipient, link);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Email send failed", 502);
  }
  return Response.json({ ok: true });
}
