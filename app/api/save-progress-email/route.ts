import { isOutboundEmailConfigured } from "@/lib/email/smtp";
import { sendProgressSavedEmail } from "@/lib/email/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

// POST /api/save-progress-email — sends the “progress saved” email with resume link + reference ID.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    to?: string;
    businessEmail?: string;
    resumeUrl?: string;
    savedAt?: string;
    currentStep?: number;
    totalSteps?: number;
    referenceId?: string;
    displayName?: string | null;
  } | null;
  if (!body || typeof body !== "object") return jsonError("Invalid body", 400);

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!to || !EMAIL_RE.test(to)) return jsonError("Invalid email", 400);

  const businessRaw = typeof body.businessEmail === "string" ? body.businessEmail.trim() : "";
  const businessOk = businessRaw && EMAIL_RE.test(businessRaw);
  const recipient = businessOk ? businessRaw : to;
  const replyToAlternate = businessOk && to.toLowerCase() !== businessRaw.toLowerCase() ? to : undefined;

  const resumeUrl = typeof body.resumeUrl === "string" ? body.resumeUrl.trim() : "";
  let resume: URL;
  try {
    resume = new URL(resumeUrl);
    if (resume.protocol !== "http:" && resume.protocol !== "https:") return jsonError("Invalid resumeUrl", 400);
  } catch {
    return jsonError("Invalid resumeUrl", 400);
  }

  const referenceId = typeof body.referenceId === "string" ? body.referenceId.trim() : "";
  if (!referenceId || !UUID_RE.test(referenceId)) return jsonError("Invalid referenceId", 400);
  const resumeParam = resume.searchParams.get("resume");
  if (resumeParam !== referenceId) return jsonError("referenceId must match resume query in resumeUrl", 400);

  const savedAt = typeof body.savedAt === "string" ? body.savedAt : "";
  if (!savedAt) return jsonError("Invalid savedAt", 400);

  const currentStep = typeof body.currentStep === "number" && Number.isFinite(body.currentStep) ? body.currentStep : 0;
  const totalSteps = typeof body.totalSteps === "number" && Number.isFinite(body.totalSteps) ? body.totalSteps : 0;
  if (totalSteps <= 0) return jsonError("Invalid totalSteps", 400);

  let displayName: string | null = null;
  if (body.displayName != null && typeof body.displayName === "string") {
    const d = body.displayName.trim().slice(0, 80);
    if (d) displayName = d;
  }

  if (!isOutboundEmailConfigured()) {
    return Response.json({ ok: true, emailed: false });
  }

  try {
    await sendProgressSavedEmail(
      recipient,
      resumeUrl,
      savedAt,
      currentStep,
      totalSteps,
      referenceId,
      displayName,
      replyToAlternate,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email send failed";
    if (msg.includes("RESEND_API_KEY") || msg.includes("Email not configured")) return jsonError("Email not configured", 503);
    return jsonError(msg, 502);
  }

  return Response.json({ ok: true, emailed: true });
}
