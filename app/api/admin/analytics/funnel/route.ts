import { getServiceClient } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse, parseDateRange } from "@/lib/analytics/adminAuth";

const TABLE = "form_events";

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

  // Fetch step_viewed and step_completed events in range
  const { data: viewed, error: e1 } = await supabase
    .from(TABLE)
    .select("step_name, session_id")
    .eq("event_type", "step_viewed")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString());

  const { data: completed, error: e2 } = await supabase
    .from(TABLE)
    .select("step_name, session_id")
    .eq("event_type", "step_completed")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString());

  const { data: backs, error: e3 } = await supabase
    .from(TABLE)
    .select("step_name, session_id")
    .eq("event_type", "step_back")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString());

  // Average time per step (from step_viewed to step_completed for same session)
  const { data: timings } = await supabase
    .from(TABLE)
    .select("session_id, step_name, event_type, timestamp")
    .in("event_type", ["step_viewed", "step_completed"])
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString())
    .order("timestamp", { ascending: true });

  if (e1 || e2) {
    const err = e1 ?? e2;
    if ((err as { code?: string }).code === "42P01") {
      return Response.json({ funnel: [], from: from.toISOString(), to: to.toISOString() });
    }
    return Response.json({ error: err?.message }, { status: 500 });
  }

  // Aggregate: count unique sessions per step
  const viewMap = new Map<string, Set<string>>();
  for (const row of viewed ?? []) {
    if (!row.step_name) continue;
    if (!viewMap.has(row.step_name)) viewMap.set(row.step_name, new Set());
    viewMap.get(row.step_name)!.add(row.session_id);
  }

  const completeMap = new Map<string, Set<string>>();
  for (const row of completed ?? []) {
    if (!row.step_name) continue;
    if (!completeMap.has(row.step_name)) completeMap.set(row.step_name, new Set());
    completeMap.get(row.step_name)!.add(row.session_id);
  }

  const backMap = new Map<string, number>();
  for (const row of (backs ?? []) as { step_name: string | null }[]) {
    if (!row.step_name) continue;
    backMap.set(row.step_name, (backMap.get(row.step_name) ?? 0) + 1);
  }

  // Compute average time per step
  type TimingRow = { session_id: string; step_name: string | null; event_type: string; timestamp: string };
  const stepTimings = new Map<string, number[]>();
  const sessionStepStart = new Map<string, number>();

  for (const row of (timings ?? []) as TimingRow[]) {
    if (!row.step_name) continue;
    const key = `${row.session_id}::${row.step_name}`;
    const ts = new Date(row.timestamp).getTime();
    if (row.event_type === "step_viewed") {
      sessionStepStart.set(key, ts);
    } else if (row.event_type === "step_completed") {
      const start = sessionStepStart.get(key);
      if (start != null) {
        const dur = ts - start;
        if (dur > 0 && dur < 3_600_000) { // cap at 1 hour
          if (!stepTimings.has(row.step_name)) stepTimings.set(row.step_name, []);
          stepTimings.get(row.step_name)!.push(dur);
        }
      }
    }
  }

  const allSteps = new Set([...viewMap.keys(), ...completeMap.keys()]);
  const funnel = Array.from(allSteps).map((step) => {
    const entered = viewMap.get(step)?.size ?? 0;
    const completedCount = completeMap.get(step)?.size ?? 0;
    const dropOff = Math.max(0, entered - completedCount);
    const dropOffPct = entered > 0 ? Math.round((dropOff / entered) * 100) : 0;
    const completionRate = entered > 0 ? Math.round((completedCount / entered) * 100) : 0;
    const durations = stepTimings.get(step) ?? [];
    const avgTimeMs = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;
    return {
      step,
      entered,
      completed: completedCount,
      dropOff,
      dropOffPct,
      completionRate,
      backNavigations: backMap.get(step) ?? 0,
      avgTimeMs,
    };
  });

  // Sort by highest drop-off rate
  funnel.sort((a, b) => b.dropOffPct - a.dropOffPct);

  return Response.json({ funnel, from: from.toISOString(), to: to.toISOString() });
}
