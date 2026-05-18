import type { Answers } from "@/lib/types";

export const LOCAL_RESUME_SESSION_PREFIX = "fo_local_resume_";
export const SAVE_PROGRESS_NOTIFY_EMAIL_KEY = "fo_save_progress_email";

export const LOCAL_RESUME_PAYLOAD_VERSION = 1 as const;

export interface LocalResumePayload {
  v: typeof LOCAL_RESUME_PAYLOAD_VERSION;
  answers: Answers;
  currentSectionIndex: number;
  savedAt: string;
  notifyEmail: string;
  submissionId: string | null;
  resumeToken: string | null;
}

function storageKey(sessionKey: string): string {
  return `${LOCAL_RESUME_SESSION_PREFIX}${sessionKey}`;
}

export function writeLocalResumeSession(sessionKey: string, payload: LocalResumePayload): void {
  try {
    window.localStorage.setItem(storageKey(sessionKey), JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readLocalResumeSession(sessionKey: string): LocalResumePayload | null {
  try {
    const raw = window.localStorage.getItem(storageKey(sessionKey));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<LocalResumePayload>;
    if (data.v !== LOCAL_RESUME_PAYLOAD_VERSION) return null;
    if (!data.answers || typeof data.answers !== "object" || Array.isArray(data.answers)) return null;
    if (typeof data.currentSectionIndex !== "number" || !Number.isFinite(data.currentSectionIndex)) return null;
    if (typeof data.savedAt !== "string") return null;
    if (typeof data.notifyEmail !== "string") return null;
    return {
      v: LOCAL_RESUME_PAYLOAD_VERSION,
      answers: data.answers as Answers,
      currentSectionIndex: data.currentSectionIndex,
      savedAt: data.savedAt,
      notifyEmail: data.notifyEmail,
      submissionId: typeof data.submissionId === "string" ? data.submissionId : null,
      resumeToken: typeof data.resumeToken === "string" ? data.resumeToken : null,
    };
  } catch {
    return null;
  }
}

export function readSaveProgressNotifyEmail(): string | null {
  try {
    const v = window.localStorage.getItem(SAVE_PROGRESS_NOTIFY_EMAIL_KEY);
    return v && v.includes("@") ? v : null;
  } catch {
    return null;
  }
}

export function writeSaveProgressNotifyEmail(email: string): void {
  try {
    window.localStorage.setItem(SAVE_PROGRESS_NOTIFY_EMAIL_KEY, email.trim());
  } catch {
    /* ignore */
  }
}
