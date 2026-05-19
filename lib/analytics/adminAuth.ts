import { getSessionFromRequest } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/constants";

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

/** Returns session when the caller is an authenticated admin. */
export async function getAdminSession(request: Request): Promise<SessionPayload | null> {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") return null;
  return session;
}

/** @deprecated Use getAdminSession — kept for gradual migration. */
export async function isAdminAuthorized(request: Request): Promise<boolean> {
  return (await getAdminSession(request)) !== null;
}

// Build a date-range WHERE clause fragment for Supabase .gte/.lte filters.
export function parseDateRange(url: URL): { from: Date; to: Date } {
  const range = url.searchParams.get("range") ?? "7d";
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  let from: Date;

  if (range === "custom") {
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    from = fromParam ? new Date(fromParam) : new Date(Date.now() - 7 * 864e5);
    if (toParam) {
      const d = new Date(toParam);
      d.setHours(23, 59, 59, 999);
      return { from, to: d };
    }
    return { from, to };
  }

  const days = range === "1d" ? 1 : range === "30d" ? 30 : 7;
  from = new Date(Date.now() - days * 864e5);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}
