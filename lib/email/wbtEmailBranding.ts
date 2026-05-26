import { WBT_LOGO_URL } from "@/lib/brand/wbtLogo";
import { buildWbtEmailLogoHtml, WBT_WEBSITE_URL } from "./wbtEmailLogo";

export { WBT_WEBSITE_URL };
export const WBT_EMAIL_LOGO_URL = WBT_LOGO_URL;

export const WBT_EMAIL_THEME = {
  /** Left card accent + primary CTA (reference) */
  accent: "#235564",
  heading: "#0f172a",
  body: "#475569",
  bodyStrong: "#0f172a",
  muted: "#64748b",
  badgeBg: "#d1fae5",
  badgeText: "#065f46",
  /** Take me in / View PDF (bright) */
  btnPrimaryBg: "#235564",
  btnPrimaryText: "#ffffff",
  /** Download — white + teal outline */
  btnOutlineBg: "#ffffff",
  btnOutlineBorder: "#235564",
  btnOutlineText: "#235564",
  /** PDF pill button (same teal as primary) */
  btnDarkBg: "#235564",
  btnDarkText: "#ffffff",
  cardBorder: "#e2e8f0",
};

export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type WbtEmailCta = { label: string; href: string; variant: "primary" | "outline" | "dark" };

export type WbtEmailLayoutParams = {
  badge: string;
  headline: string;
  bodyHtml: string;
  ctas: WbtEmailCta[];
  footerNote?: string;
};

/** WBT card layout for save-progress and completion emails. */
export function buildWbtEmailLayout(params: WbtEmailLayoutParams): string {
  const t = WBT_EMAIL_THEME;
  const logoHtml = buildWbtEmailLogoHtml();

  const ctaCells = params.ctas
    .map((cta, i) => {
      const href = escapeAttr(cta.href);
      const padLeft = i > 0 ? "padding-left:8px;" : "";
      const style =
        cta.variant === "dark"
          ? `display:inline-block;background:${t.btnDarkBg};color:${t.btnDarkText};text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:9999px;border:none;`
          : cta.variant === "primary"
            ? `display:inline-block;background:${t.btnPrimaryBg};color:${t.btnPrimaryText};text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;border:none;`
            : `display:inline-block;background:${t.btnOutlineBg};border:1px solid ${t.btnOutlineBorder};color:${t.btnOutlineText};text-decoration:none;font-weight:600;font-size:14px;padding:11px 24px;border-radius:8px;`;
      return `<td style="${padLeft}"><a href="${href}" style="${style}">${escapeHtml(cta.label)}</a></td>`;
    })
    .join("");

  const footer = params.footerNote
    ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${t.muted};">${escapeHtml(params.footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;border-radius:12px;border:1px solid ${t.cardBorder};border-left:5px solid ${t.accent};">
        <tr><td style="padding:28px 28px 24px;">
          ${logoHtml}
          <p style="margin:20px 0 16px;">
            <span style="display:inline-block;background:${t.badgeBg};color:${t.badgeText};font-size:12px;font-weight:600;padding:6px 12px;border-radius:9999px;">&#10003; ${escapeHtml(params.badge)}</span>
          </p>
          <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;line-height:1.35;color:${t.heading};">${params.headline}</h1>
          <div style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${t.body};">${params.bodyHtml}</div>
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>${ctaCells}</tr></table>
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
