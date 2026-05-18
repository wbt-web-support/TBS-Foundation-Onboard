import { buildWbtEmailLayout, escapeHtml } from "./wbtEmailBranding";

export interface ProgressSavedEmailParams {
  resumeUrl: string;
  savedAtIso: string;
  currentStep: number;
  totalSteps: number;
  referenceId: string;
  displayName: string | null;
}

export function buildProgressSavedEmail(params: ProgressSavedEmailParams): { html: string; text: string } {
  const { resumeUrl, displayName } = params;
  const name = displayName?.trim() || null;
  const headline = name ? `Hi ${escapeHtml(name)},` : "Your progress has been saved";

  const bodyHtml =
    "Your onboarding form has been successfully saved. Please click the button below to proceed.";

  const html = buildWbtEmailLayout({
    badge: "Progress saved",
    headline,
    bodyHtml,
    ctas: [{ label: "Take me in", href: resumeUrl, variant: "primary" }],
  });

  const text = `${name ? `Hi ${name},` : "Your progress has been saved"}

Your onboarding form has been successfully saved. Please click the button below to proceed.

Take me in: ${resumeUrl}`;

  return { html, text };
}
