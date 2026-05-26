const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Parse dynamic route segment from Next.js `useParams()`. */
export function parseSubmissionIdParam(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return decodeURIComponent((value ?? "").trim());
}

export function isSubmissionId(id: string): boolean {
  return UUID_RE.test(id);
}
