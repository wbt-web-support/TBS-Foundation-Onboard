/** Escape text for HTML body (not for raw URL inside href after URL validation). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatSavedAtForEmail(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export interface ProgressSavedEmailParams {
  resumeUrl: string;
  savedAtIso: string;
  currentStep: number;
  totalSteps: number;
  referenceId: string;
  /** First name etc.; shown in green headline when present. */
  displayName: string | null;
}

export function buildProgressSavedEmail(params: ProgressSavedEmailParams): { html: string; text: string } {
  const { resumeUrl, savedAtIso, currentStep, totalSteps, displayName } = params;
  const savedDisplay = escapeHtml(formatSavedAtForEmail(savedAtIso));
  const headline = displayName?.trim()
    ? `Welcome aboard, ${escapeHtml(displayName.trim())}! 🎉`
    : `Progress saved! 🎉`;
  const subline =
    "Your progress is saved. Open the link on the same device and browser where you saved to pick up exactly where you left off.";

  const text = `${displayName?.trim() ? `Welcome aboard, ${displayName.trim()}!` : "Progress saved!"}

${subline}

Take me in (continue questionnaire):
${resumeUrl}

Saved at: ${formatSavedAtForEmail(savedAtIso)}
Progress: Step ${currentStep} of ${totalSteps}

If the button does not work, copy and paste the link into your browser.`;

  const green = "#10b981";
  const bgOuter = "#ffffff";
  const cardBg = "#ffffff";
  const textMuted = "#334155";
  const textDim = "#64748b";
  const borderSubtle = "#e2e8f0";

  const hrefAttr = resumeUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const appBase =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL?.trim()
      ? process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "")
      : "";
  const logoSrc = appBase ? `${appBase}/logo/wbt-email-mark.svg` : "";
  const logoImg = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" width="200" height="40" alt="We Build Trades" style="display:block;margin:0 auto 8px;max-width:220px;height:auto;" />`
    : `<p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">We Build Trades</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px 12px;background:${bgOuter};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" style="max-width:480px;width:100%;background:${cardBg};border-radius:20px;border:1px solid ${borderSubtle};">
          <tr>
            <td style="padding:40px 28px 32px;text-align:center;">
              ${logoImg}
              <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:${green};line-height:1.3;">${headline}</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:${textMuted};">${escapeHtml(subline)}</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:${textDim};">
                Saved at: <strong style="color:${textMuted};">${savedDisplay}</strong><br/>
                Progress: <strong style="color:${textMuted};">Step ${currentStep} of ${totalSteps}</strong>
              </p>
              <a href="${hrefAttr}" style="display:inline-block;background:${green};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 36px;border-radius:9999px;">Take me in</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
