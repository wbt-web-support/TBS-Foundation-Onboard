/** Decode `completion_pdf` bytea from Supabase (hex, base64, or binary). */
export function bufferFromDbValue(raw: unknown): Buffer | null {
  if (!raw) return null;
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  if (Array.isArray(raw)) return Buffer.from(raw);

  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return Buffer.from(o.data as number[]);
    if (typeof o.data === "string") return bufferFromDbValue(o.data);
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^\\x[0-9a-f]+$/i.test(s)) return Buffer.from(s.slice(2), "hex");
    if (/^0x[0-9a-f]+$/i.test(s)) return Buffer.from(s.slice(2), "hex");
    try {
      const buf = Buffer.from(s, "base64");
      if (buf.length > 0) return buf;
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length > 4 && buf.slice(0, 5).toString("ascii") === "%PDF-";
}

/** Value for Supabase `bytea` column (Node Buffer is accepted by supabase-js). */
export function encodeCompletionPdfForDb(buffer: Buffer): Buffer {
  return buffer;
}

export async function fetchSubmissionPdfBlob(
  submissionId: string,
  init?: RequestInit,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`/api/admin/clients/${submissionId}/pdf`, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "PDF download failed");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] ?? "onboarding-completion.pdf";
  return { blob, filename };
}

export function isAdminPdfApiUrl(url: string): boolean {
  return url.startsWith("/api/admin/clients/") && url.endsWith("/pdf");
}
