export const SESSION_COOKIE = "fo_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export type UserRole = "admin" | "client";

export type SessionPayload = {
  sub: string;
  email: string;
  role: UserRole;
  submissionId?: string;
};
