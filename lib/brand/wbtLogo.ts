import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Official WBT logo — use for frontend, email, and PDF. Override via env if needed. */
export const WBT_LOGO_URL =
  process.env.NEXT_PUBLIC_WBT_LOGO_URL?.trim() ||
  process.env.WBT_LOGO_URL?.trim() ||
  process.env.EMAIL_LOGO_URL?.trim() ||
  process.env.NEXT_PUBLIC_EMAIL_LOGO_URL?.trim() ||
  "https://dtgcctkekahzjtvepowr.supabase.co/storage/v1/object/public/images/unnamed.png";

export const WBT_WEBSITE_URL = "https://webuildtrades.com/";

export const WBT_LOGO_DISPLAY = { width: 200, height: 40 } as const;

let cachedLogoBuffer: Buffer | null | undefined;

function loadLogoFromDisk(): Buffer | null {
  for (const rel of ["public/WBT-logo.png", "public/brand-img/WBT-logo.png"]) {
    const filePath = path.join(process.cwd(), rel);
    if (existsSync(filePath)) {
      try {
        return readFileSync(filePath);
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

/** Logo bytes for PDFKit (fetches hosted PNG, falls back to local file). */
export async function loadWbtLogoBuffer(): Promise<Buffer | null> {
  if (cachedLogoBuffer !== undefined) return cachedLogoBuffer;

  try {
    const res = await fetch(WBT_LOGO_URL, { signal: AbortSignal.timeout(12_000) });
    if (res.ok) {
      cachedLogoBuffer = Buffer.from(await res.arrayBuffer());
      return cachedLogoBuffer;
    }
  } catch {
    /* fall through */
  }

  cachedLogoBuffer = loadLogoFromDisk();
  return cachedLogoBuffer;
}
