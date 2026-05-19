import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC, type SessionPayload } from "./constants";
import { signSessionToken, verifySessionToken } from "./jwt";

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  return signSessionToken(payload, SESSION_MAX_AGE_SEC);
}

export function sessionCookieOptions(token: string) {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** Read JWT from HttpOnly cookie on the server. */
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Read JWT from cookie or Authorization: Bearer header (API routes). */
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifySessionToken(auth.slice(7));
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (match?.[1]) {
    return verifySessionToken(decodeURIComponent(match[1]));
  }
  return null;
}
