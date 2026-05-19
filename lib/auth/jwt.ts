import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "./constants";

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
  maxAgeSec: number,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    if (role !== "admin" && role !== "client") return null;
    const submissionId =
      typeof payload.submissionId === "string" ? payload.submissionId : undefined;
    return { sub, email, role, submissionId };
  } catch {
    return null;
  }
}
