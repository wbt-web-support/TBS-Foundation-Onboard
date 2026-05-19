"use client";

// Fire-and-forget analytics tracking. All events are non-blocking and PII-free.
// Session IDs are random per browser session (no linkage to user identity).

const SESSION_KEY = "fo_analytics_session";

export type EventType =
  | "step_viewed"
  | "step_completed"
  | "step_back"
  | "field_focused"
  | "field_errored"
  | "field_edited"
  | "form_submitted"
  | "form_completed"
  | "form_abandoned"
  | "form_error";

export interface TrackPayload {
  sessionId: string;
  stepName?: string;
  fieldName?: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
}

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Other";
}

export function track(
  eventType: EventType,
  opts: { stepName?: string; fieldName?: string; metadata?: Record<string, unknown> } = {},
): void {
  if (typeof window === "undefined") return;

  const payload: TrackPayload = {
    sessionId: getOrCreateSessionId(),
    eventType,
    stepName: opts.stepName,
    fieldName: opts.fieldName,
    metadata: {
      device: getDeviceType(),
      browser: getBrowser(),
      ...opts.metadata,
    },
  };

  // sendBeacon is fire-and-forget and survives page unload
  const body = JSON.stringify(payload);
  const sent = navigator.sendBeacon?.("/api/analytics/track", new Blob([body], { type: "application/json" }));

  if (!sent) {
    // fallback for environments where sendBeacon isn't available
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {/* fire-and-forget */});
  }
}

// Convenience wrappers
export const trackStepViewed    = (stepName: string) => track("step_viewed", { stepName });
export const trackStepCompleted = (stepName: string, timeSpentMs?: number) =>
  track("step_completed", { stepName, metadata: timeSpentMs != null ? { timeSpentMs } : {} });
export const trackStepBack      = (fromStep: string, toStep: string) =>
  track("step_back", { stepName: fromStep, metadata: { toStep } });
export const trackFieldErrored  = (stepName: string, fieldName: string) =>
  track("field_errored", { stepName, fieldName });
export const trackFieldEdited   = (stepName: string, fieldName: string) =>
  track("field_edited", { stepName, fieldName });
export const trackFormSubmitted = (stepName: string) => track("form_submitted", { stepName });
export const trackFormCompleted = () => track("form_completed");
export const trackFormAbandoned = (stepName: string) => track("form_abandoned", { stepName });
export const trackFormError     = (stepName: string, reason: string) =>
  track("form_error", { stepName, metadata: { reason } });
