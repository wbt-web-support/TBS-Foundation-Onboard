import { asStringOrNull, getByPath } from "@/lib/answers";
import type { Answers } from "@/lib/types";
import { getApplicantFirstName } from "./applicantFirstName";
import { buildWbtEmailLayout, escapeHtml, WBT_EMAIL_THEME, WBT_WEBSITE_URL } from "./wbtEmailBranding";

function companyName(answers: Answers): string {
  return asStringOrNull(getByPath(answers, "company_details.company_name")) ?? "your business";
}

export interface UserCompletionEmailParams {
  answers: Answers;
  pdfViewUrl: string | null;
}

/** Thank-you email sent to the person who completed the onboarding form. */
export function buildUserCompletionEmail(params: UserCompletionEmailParams): { html: string; text: string } {
  const first = getApplicantFirstName(params.answers);
  const company = escapeHtml(companyName(params.answers));
  const headline = first
    ? `Thank you, ${escapeHtml(first)}!`
    : "Thank you for completing your questionnaire";

  const bodyHtml = `We have received your onboarding answers for <strong style="color:${WBT_EMAIL_THEME.bodyStrong};">${company}</strong>. Our team will review your submission and be in touch about next steps. A PDF copy of your responses is attached.`;

  const pdfUrl = params.pdfViewUrl?.trim() || "";
  const ctas: { label: string; href: string; variant: "primary" | "outline" | "dark" }[] = [];
  if (pdfUrl) {
    ctas.push({ label: "View your PDF", href: pdfUrl, variant: "primary" });
  }

  const html = buildWbtEmailLayout({
    badge: "Submission received",
    headline,
    bodyHtml,
    ctas: ctas.length > 0 ? ctas : [{ label: "We Build Trades", href: WBT_WEBSITE_URL, variant: "primary" }],
    footerNote: "If you have questions, reply to this email or contact your account manager.",
  });

  const text = `${first ? `Thank you, ${first}!` : "Thank you for completing your questionnaire."}

We have received your onboarding answers for ${companyName(params.answers)}. Our team will review your submission and be in touch about next steps.

${pdfUrl ? `View your PDF: ${pdfUrl}\n` : ""}A PDF copy of your responses is attached to this email.`;

  return { html, text };
}
