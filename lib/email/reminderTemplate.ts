import { buildWbtEmailLayout, escapeHtml } from "./wbtEmailBranding";

export interface ReminderEmailParams {
  resumeUrl: string;
  displayName?: string | null;
}

export function buildReminderEmail(params: ReminderEmailParams): { html: string; text: string } {
  const { resumeUrl, displayName } = params;
  const name = displayName?.trim() || null;
  const headline = name ? `Hi ${escapeHtml(name)}, your form is waiting` : "Your onboarding form is waiting";

  const bodyHtml = `You started your onboarding questionnaire but haven't finished it yet.
    <br/><br/>
    Your answers are saved — just click the button below to pick up where you left off.
    It only takes a few minutes to complete.`;

  const html = buildWbtEmailLayout({
    badge: "Action required",
    headline,
    bodyHtml,
    ctas: [{ label: "Complete my form", href: resumeUrl, variant: "primary" }],
    footerNote: "If you believe you received this in error, please ignore this email.",
  });

  const text = `${name ? `Hi ${name},` : "Hi there,"}

Your onboarding questionnaire is still waiting to be completed.

Your answers are saved — click the link below to pick up where you left off:

${resumeUrl}

If you believe you received this in error, please ignore this email.`;

  return { html, text };
}
