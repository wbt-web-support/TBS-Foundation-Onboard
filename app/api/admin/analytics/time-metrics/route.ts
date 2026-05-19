import { getServiceClient } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse, parseDateRange } from "@/lib/analytics/adminAuth";

const TABLE = "form_events";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
}

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
    .select("session_id, event_type, step_name, timestamp")
    .in("event_type", ["step_viewed", "step_completed", "form_completed"])
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString())
    .order("timestamp", { ascending: true });

  if (error) {
    if ((error as { code?: string }).code === "42P01") {
      return Response.json({ avgCompletionMs: null, p75Ms: 0, p90Ms: 0, outlierCount: 0, completedSessions: 0, stepAvgTimes: [], from: from.toISOString(), to: to.toISOString() });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  type Row = { session_id: string; event_type: string; step_name: string | null; timestamp: string };
  const rows = (events ?? []) as Row[];

  // Session total time: first event → form_completed
  const sessionFirstEvent = new Map<string, number>();
  const sessionLastEvent  = new Map<string, number>();
  const sessionCompleted  = new Set<string>();

  for (const row of rows) {
    const ts = new Date(row.timestamp).getTime();
    if (!sessionFirstEvent.has(row.session_id)) sessionFirstEvent.set(row.session_id, ts);
    sessionLastEvent.set(row.session_id, ts);
    if (row.event_type === "form_completed") sessionCompleted.add(row.session_id);
  }

  const completionTimes: number[] = [];
  for (const sid of sessionCompleted) {
    const first = sessionFirstEvent.get(sid);
    const last  = sessionLastEvent.get(sid);
    if (first != null && last != null) {
      const dur = last - first;
      if (dur > 0 && dur < 7_200_000) completionTimes.push(dur); // cap at 2 hours
    }
  }

  completionTimes.sort((a, b) => a - b);
  const avgCompletionMs = completionTimes.length
    ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
    : null;
  const p75Ms = percentile(completionTimes, 75);
  const p90Ms = percentile(completionTimes, 90);

  // Outliers: sessions taking > p90 (or > 30 min if no data)
  const outlierThresholdMs = p90Ms || 30 * 60_000;
  const outlierCount = completionTimes.filter((t) => t > outlierThresholdMs).length;

  // Per-step average time
  const stepTimings = new Map<string, number[]>();
  const sessionStepStart = new Map<string, number>();

  for (const row of rows) {
    if (!row.step_name) continue;
    const key = `${row.session_id}::${row.step_name}`;
    const ts = new Date(row.timestamp).getTime();
    if (row.event_type === "step_viewed") {
      sessionStepStart.set(key, ts);
    } else if (row.event_type === "step_completed") {
      const start = sessionStepStart.get(key);
      if (start != null) {
        const dur = ts - start;
        if (dur > 0 && dur < 3_600_000) {
          if (!stepTimings.has(row.step_name)) stepTimings.set(row.step_name, []);
          stepTimings.get(row.step_name)!.push(dur);
        }
      }
    }
  }

  const stepAvgTimes = Array.from(stepTimings.entries()).map(([step, durations]) => ({
    step,
    avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    sampleSize: durations.length,
  }));

  return Response.json({
    avgCompletionMs,
    p75Ms,
    p90Ms,
    outlierCount,
    completedSessions: sessionCompleted.size,
    stepAvgTimes,
    from: from.toISOString(),
    to: to.toISOString(),
  });
}
