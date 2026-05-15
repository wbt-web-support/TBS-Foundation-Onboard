import { WBT_LOGO_DISPLAY, WBT_LOGO_URL, WBT_WEBSITE_URL } from "@/lib/brand/wbtLogo";

export { WBT_WEBSITE_URL };

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function resolveWbtEmailLogoSrc(): string {
  return WBT_LOGO_URL;
}

/** Linked logo image for HTML email (hosted HTTPS — works in Gmail/Outlook). */
export function buildWbtEmailLogoHtml(): string {
  const href = escapeAttr(WBT_WEBSITE_URL);
  const src = escapeAttr(resolveWbtEmailLogoSrc());
  const { width, height } = WBT_LOGO_DISPLAY;
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;line-height:0;margin:0 0 12px;">
  <img src="${src}" width="${width}" height="${height}" alt="We Build Trades" style="display:block;border:0;max-width:${width}px;width:${width}px;height:auto;" />
</a>`;
}
