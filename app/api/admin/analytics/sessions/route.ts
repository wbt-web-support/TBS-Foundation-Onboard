import { getServiceClient } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse, parseDateRange } from "@/lib/analytics/adminAuth";

const TABLE = "form_events";
const ABANDON_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes inactivity = abandoned

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const url = new URL(request.url);
  const { from, to } = parseDateRange(url);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: events, error } = await supabase
    .from(TABLE)
    .select("session_id, event_type, timestamp")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString())
    .order("timestamp", { ascending: true });

  if (error) {
    // 42P01 = table does not exist — migration not run yet, return empty data
    if ((error as { code?: string }).code === "42P01") {
      return Response.json({ total: 0, counts: { started: 0, inProgress: 0, abandoned: 0, completed: 0, failed: 0 }, reEngagedCount: 0, from: from.toISOString(), to: to.toISOString() });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Per-session classification
  type Row = { session_id: string; event_type: string; timestamp: string };
  const sessionEvents = new Map<string, Row[]>();
  for (const row of (events ?? []) as Row[]) {
    if (!sessionEvents.has(row.session_id)) sessionEvents.set(row.session_id, []);
    sessionEvents.get(row.session_id)!.push(row);
  }

  const counts = { started: 0, inProgress: 0, abandoned: 0, completed: 0, failed: 0 };
  const reEngaged: string[] = [];

  const now = Date.now();

  for (const [sessionId, rows] of sessionEvents) {
    const types = new Set(rows.map((r) => r.event_type));
    const lastTs = new Date(rows[rows.length - 1].timestamp).getTime();
    const inactiveMs = now - lastTs;

    if (types.has("form_completed")) {
      counts.completed++;
    } else if (types.has("form_error")) {
      counts.failed++;
    } else if (types.has("form_abandoned") || inactiveMs > ABANDON_THRESHOLD_MS) {
      counts.abandoned++;
    } else if (types.has("step_completed") || types.has("step_viewed")) {
      // More than 1 step viewed means in-progress
      const stepViews = rows.filter((r) => r.event_type === "step_viewed");
      if (stepViews.length > 0) {
        counts.inProgress++;
      } else {
        counts.started++;
      }
    } else {
      counts.started++;
    }

    // Re-engagement: sessions with a gap of > 30 min between events
    if (rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const gap = new Date(rows[i].timestamp).getTime() - new Date(rows[i - 1].timestamp).getTime();
        if (gap > 30 * 60 * 1000) {
          reEngaged.push(sessionId);
          break;
        }
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return Response.json({
    total,
    counts,
    reEngagedCount: reEngaged.length,
    from: from.toISOString(),
    to: to.toISOString(),
  });
}
