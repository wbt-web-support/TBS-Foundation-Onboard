import { getServiceClient } from "@/lib/supabase/server";

const FORM_EVENTS_TABLE = "form_events";

const VALID_EVENT_TYPES = new Set([
  "step_viewed",
  "step_completed",
  "step_back",
  "field_focused",
  "field_errored",
  "field_edited",
  "form_submitted",
  "form_completed",
  "form_abandoned",
  "form_error",
]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  if (!body || typeof body !== "object") return new Response(null, { status: 204 });

  const { sessionId, stepName, fieldName, eventType, metadata } = body as Record<string, unknown>;

  if (typeof sessionId !== "string" || !sessionId) return new Response(null, { status: 204 });
  if (typeof eventType !== "string" || !VALID_EVENT_TYPES.has(eventType)) return new Response(null, { status: 204 });

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return new Response(null, { status: 204 });
  }

  const { error } = await supabase.from(FORM_EVENTS_TABLE).insert({
    session_id: sessionId,
    step_name: typeof stepName === "string" ? stepName : null,
    field_name: typeof fieldName === "string" ? fieldName : null,
    event_type: eventType,
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  });

  if (error && process.env.NODE_ENV === "development") {
    console.error("[analytics/track]", error.message);
  }

  // Always return 204 — client is fire-and-forget, don't surface errors
  return new Response(null, { status: 204 });
}
