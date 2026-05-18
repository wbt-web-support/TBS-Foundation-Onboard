import { asStringOrNull, getByPath } from "@/lib/answers";
import type { Answers } from "@/lib/types";
import { getApplicantFullName } from "./applicantFirstName";
import { buildWbtEmailLayout, escapeHtml, WBT_EMAIL_THEME } from "./wbtEmailBranding";

function companyName(answers: Answers): string {
  return asStringOrNull(getByPath(answers, "company_details.company_name")) ?? "your business";
}

export interface CompletionPdfEmailParams {
  answers: Answers;
  pdfViewUrl: string | null;
}

/** Admin notification when a client completes onboarding (PDF attached). */
export function buildCompletionPdfEmail(params: CompletionPdfEmailParams): { html: string; text: string } {
  const submitter = escapeHtml(getApplicantFullName(params.answers) ?? "A client");
  const company = escapeHtml(companyName(params.answers));
  const pdfUrl = params.pdfViewUrl?.trim() || "";
  const strong = WBT_EMAIL_THEME.bodyStrong;

  const headline = `<strong style="color:${strong};">${company}</strong> has filled out the questionnaire form for <strong style="color:${strong};">${submitter}</strong>.`;

  const bodyHtml = "You can access the PDF file by clicking the button below.";

  const ctas: { label: string; href: string; variant: "primary" | "outline" | "dark" }[] = [];
  if (pdfUrl) {
    ctas.push({ label: "PDF file", href: pdfUrl, variant: "dark" });
  }

  const html = buildWbtEmailLayout({
    badge: "Form completed",
    headline,
    bodyHtml,
    ctas,
    footerNote: "Copy of the PDF is also attached for your reference.",
  });

  const plainSubmitter = getApplicantFullName(params.answers) ?? "A client";
  const plainCompany = companyName(params.answers);

  const text = `${plainCompany} has filled out the questionnaire form for ${plainSubmitter}.

You can access the PDF file by clicking the button below.

${pdfUrl ? `PDF file: ${pdfUrl}\n` : ""}
Copy of the PDF is also attached for your reference.`;

  return { html, text };
}
