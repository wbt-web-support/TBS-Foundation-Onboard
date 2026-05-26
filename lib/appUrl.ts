/**
 * Public site URL for resume links in emails.
 * Set `NEXT_PUBLIC_APP_URL` in Vercel (e.g. https://tbs-foundation-onboard.vercel.app).
 */
export function getPublicAppBaseUrl(fallbackOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const fallback = fallbackOrigin?.trim().replace(/\/$/, "");
  if (fallback) return fallback;
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

/** Resume link used in save-progress and resume emails. */
export function buildResumeUrl(refId: number | string, fallbackOrigin?: string): string {
  const base = getPublicAppBaseUrl(fallbackOrigin);
  return base ? `${base}/?id=${refId}` : `/?id=${refId}`;
}

/** Prefer production base when env is set (fixes localhost links from dev clients). */
export function normalizeResumeUrlForEmail(clientResumeUrl: string, fallbackOrigin?: string): string {
  const base = getPublicAppBaseUrl(fallbackOrigin);
  if (!base) return clientResumeUrl;
  try {
    const parsed = new URL(clientResumeUrl);
    const refId = parsed.searchParams.get("id");
    if (refId) return buildResumeUrl(refId, fallbackOrigin);
  } catch {
    /* keep client URL */
  }
  return clientResumeUrl;
}
