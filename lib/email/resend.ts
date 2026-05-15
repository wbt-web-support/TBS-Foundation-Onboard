import { Resend } from "resend";
import { applicantBusinessEmail } from "@/lib/email/applicantBusinessEmail";
import { buildOnboardingAnswersPdfBuffer, completionPdfFilename } from "@/lib/pdf/onboardingAnswersPdf";
import type { Answers } from "@/lib/types";
import { buildCompletionPdfEmail } from "./completionPdfTemplate";
import { buildProgressSavedEmail } from "./progressSavedTemplate";
import { isOutboundEmailConfigured, isSmtpConfigured, sendMailViaSmtp } from "./smtp";

let cached: Resend | null = null;

function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  cached = new Resend(key);
  return cached;
}

async function sendOutbound(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}): Promise<void> {
  const replyTo = options.replyTo?.trim();

  if (isSmtpConfigured()) {
    await sendMailViaSmtp({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo,
      attachments: options.attachments,
    });
    return;
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error(
      "Email not configured: set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD, or set RESEND_API_KEY",
    );
  }

  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const resend = getResend();
  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    ...(replyTo ? { replyTo } : {}),
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
  if (error) throw new Error(typeof error === "string" ? error : error.message ?? "Email send failed");
}

export async function sendResumeEmail(to: string, link: string, replyTo?: string): Promise<void> {
  const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 12px">Pick up where you left off</h2>
        <p style="margin:0 0 16px;color:#475569;line-height:1.5">
          Thanks for getting started on your onboarding questionnaire. Your answers are saved.
          Use the button below any time to continue, no need to start over.
        </p>
        <p style="margin:0 0 24px">
          <a href="${link}"
             style="display:inline-block;background:#d94e15;color:#fff;text-decoration:none;
                    padding:12px 22px;border-radius:8px;font-weight:600">
            Continue onboarding
          </a>
        </p>
        <p style="margin:0;color:#94a3b8;font-size:13px;word-break:break-all">${link}</p>
      </div>
    `;
  await sendOutbound({
    to,
    subject: "Continue your Foundation onboarding",
    html,
    ...(replyTo && replyTo !== to ? { replyTo } : {}),
  });
}

export async function sendProgressSavedEmail(
  to: string,
  resumeUrl: string,
  savedAt: string,
  currentStep: number,
  totalSteps: number,
  referenceId: string,
  displayName?: string | null,
  replyTo?: string,
): Promise<void> {
  const { html, text } = buildProgressSavedEmail({
    resumeUrl,
    savedAtIso: savedAt,
    currentStep,
    totalSteps,
    referenceId,
    displayName: displayName ?? null,
  });
  await sendOutbound({
    to,
    subject: "Foundation Onboard Saved",
    html,
    text,
    ...(replyTo && replyTo !== to ? { replyTo } : {}),
  });
}

const COMPLETION_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sends a PDF mirror of the questionnaire to the respondent when onboarding is completed (requires outbound mail). */
export async function sendCompletionReportWithPdf(
  to: string,
  answers: Answers,
  pdfBuffer?: Buffer,
  pdfPublicUrl?: string | null,
): Promise<void> {
  if (!isOutboundEmailConfigured()) return;
  const business = applicantBusinessEmail(answers);
  const target = business && COMPLETION_EMAIL_RE.test(business) ? business : to.trim();
  if (!target || !COMPLETION_EMAIL_RE.test(target)) return;

  const pdf = pdfBuffer ?? (await buildOnboardingAnswersPdfBuffer(answers));
  const filename = completionPdfFilename(answers);
  const { html, text } = buildCompletionPdfEmail({
    answers,
    pdfViewUrl: pdfPublicUrl ?? null,
  });

  await sendOutbound({
    to: target,
    subject: "Questionnaire completed — PDF ready",
    html,
    text,
    attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
  });
}
