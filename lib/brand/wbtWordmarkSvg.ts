/** Shared WBT wordmark SVG (light backgrounds). Used in app header and HTML email. */
export const WBT_WORDMARK_VIEWBOX = "0 0 200 36";

export function wbtWordmarkSvgMarkup(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WBT_WORDMARK_VIEWBOX}" width="200" height="36" role="img" aria-label="We Build Trades">
<title>We Build Trades</title>
<path fill="#14b8a6" d="M2 28 18 12 34 20 18 28z"/>
<path fill="#0d9488" d="M10 30 26 14 42 22 26 30z" opacity="0.88"/>
<path fill="#115e59" d="M6 30 14 22 22 26 14 30z" opacity="0.35"/>
<text x="50" y="25" font-family="Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="15" font-weight="700" fill="#0f172a">We </text>
<text x="76" y="25" font-family="Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="15" font-weight="700" fill="#14b8a6">Build </text>
<text x="118" y="25" font-family="Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="15" font-weight="700" fill="#0f172a">Trades</text>
</svg>`;
}

/** Raster-friendly logo for email &lt;img src&gt; (no baked-in background). */
export function wbtWordmarkSvgDataUri(): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(wbtWordmarkSvgMarkup())}`;
}

/** Email-safe HTML wordmark (no external image — works in Gmail, Outlook, SMTP). */
export function buildWbtEmailWordmarkHtml(websiteUrl: string): string {
  const href = websiteUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;margin:0 0 12px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
<tr>
<td style="vertical-align:middle;padding-right:10px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
<tr><td width="32" height="11" style="width:32px;height:11px;background-color:#14b8a6;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
<tr><td width="32" height="11" style="width:32px;height:11px;background-color:#0d9488;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
<tr><td width="32" height="11" style="width:32px;height:11px;background-color:#115e59;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
</table>
</td>
<td style="vertical-align:middle;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;white-space:nowrap;">
<span style="font-size:17px;font-weight:700;color:#0f172a;line-height:1.2;">We&nbsp;</span><span style="font-size:17px;font-weight:700;color:#14b8a6;line-height:1.2;">Build&nbsp;</span><span style="font-size:17px;font-weight:700;color:#0f172a;line-height:1.2;">Trades</span>
</td>
</tr>
</table>
</a>`;
}

