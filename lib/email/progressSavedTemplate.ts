import {
  buildWbtEmailLayout,
  escapeHtml,
  WBT_EMAIL_THEME,
  WBT_WEBSITE_URL,
} from "./wbtEmailBranding";

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
  const name = displayName?.trim();
  const headline = name
    ? `Welcome aboard, ${escapeHtml(name)}!`
    : "Your progress has been saved";

  const strong = WBT_EMAIL_THEME.bodyStrong;
  const bodyHtml = `Your progress is saved. Open the link on the <strong style="color:${strong};">same device and browser</strong> where you saved to pick up exactly where you left off.`;

  const html = buildWbtEmailLayout({
    badge: "Progress saved",
    headline,
    bodyHtml,
    ctas: [{ label: "Take me in", href: resumeUrl, variant: "primary" }],
    footerNote: `We Build Trades — ${WBT_WEBSITE_URL}`,
  });

  const text = `${name ? `Welcome aboard, ${name}!` : "Your progress has been saved!"}

Your progress is saved. Continue on the same device and browser where you saved.

Take me in: ${resumeUrl}

We Build Trades: ${WBT_WEBSITE_URL}`;

  return { html, text };
}
