import { asStringOrNull, getByPath } from "@/lib/answers";
import type { Answers, FieldGroupAnswer } from "@/lib/types";
import { buildWbtEmailLayout, escapeHtml, WBT_EMAIL_THEME } from "./wbtEmailBranding";

function submitterName(answers: Answers): string {
  const card = answers.your_name;
  if (card && typeof card === "object" && !Array.isArray(card)) {
    const fg = card as FieldGroupAnswer;
    const first = typeof fg.first_name === "string" ? fg.first_name.trim() : "";
    const last = typeof fg.last_name === "string" ? fg.last_name.trim() : "";
    const full = [first, last].filter(Boolean).join(" ");
    if (full) return full;
  }
  return "A client";
}

function companyName(answers: Answers): string {
  return asStringOrNull(getByPath(answers, "company_details.company_name")) ?? "your business";
}

export interface CompletionPdfEmailParams {
  answers: Answers;
  pdfViewUrl: string | null;
}

export function buildCompletionPdfEmail(params: CompletionPdfEmailParams): { html: string; text: string } {
  const name = escapeHtml(submitterName(params.answers));
  const company = escapeHtml(companyName(params.answers));
  const pdfUrl = params.pdfViewUrl?.trim() || "";

  const bodyHtml = `A new questionnaire form has been completed on behalf of <strong style="color:${WBT_EMAIL_THEME.bodyStrong};">${company}</strong>. Review the submission below.`;

  const ctas: { label: string; href: string; variant: "primary" | "outline" | "dark" }[] = [];
  if (pdfUrl) {
    ctas.push({ label: "View PDF", href: pdfUrl, variant: "dark" });
    ctas.push({ label: "Download", href: pdfUrl, variant: "outline" });
  }

  const html = buildWbtEmailLayout({
    badge: "Form completed",
    headline: `${name} submitted the questionnaire`,
    bodyHtml,
    ctas:
      ctas.length > 0
        ? ctas
        : [{ label: "Open We Build Trades", href: "https://webuildtrades.com/", variant: "primary" }],
    footerNote: "PDF copy also attached to this email.",
  });

  const text = `${submitterName(params.answers)} submitted the questionnaire

A new questionnaire form has been completed on behalf of ${companyName(params.answers)}.

${pdfUrl ? `View PDF: ${pdfUrl}\n` : ""}PDF copy also attached to this email.`;

  return { html, text };
}
