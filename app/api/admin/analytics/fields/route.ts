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

  const { data: events, error } = await supabase
    .from(TABLE)
    .select("field_name, step_name, event_type, session_id")
    .in("event_type", ["field_errored", "field_edited", "field_focused"])
    .not("field_name", "is", null)
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString());

  if (error) {
    if ((error as { code?: string }).code === "42P01") {
      return Response.json({ fieldErrors: [], fieldEdits: [], from: from.toISOString(), to: to.toISOString() });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  type Row = { field_name: string | null; step_name: string | null; event_type: string; session_id: string };
  const errorMap = new Map<string, { count: number; step: string | null }>();
  const editMap  = new Map<string, { count: number; step: string | null }>();

  for (const row of (events ?? []) as Row[]) {
    if (!row.field_name) continue;
    const key = row.field_name;
    if (row.event_type === "field_errored") {
      const prev = errorMap.get(key) ?? { count: 0, step: row.step_name };
      errorMap.set(key, { count: prev.count + 1, step: prev.step ?? row.step_name });
    } else if (row.event_type === "field_edited") {
      const prev = editMap.get(key) ?? { count: 0, step: row.step_name };
      editMap.set(key, { count: prev.count + 1, step: prev.step ?? row.step_name });
    }
  }

  const fieldErrors = Array.from(errorMap.entries())
    .map(([field, { count, step }]) => ({ field, step, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const fieldEdits = Array.from(editMap.entries())
    .map(([field, { count, step }]) => ({ field, step, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return Response.json({ fieldErrors, fieldEdits, from: from.toISOString(), to: to.toISOString() });
}
