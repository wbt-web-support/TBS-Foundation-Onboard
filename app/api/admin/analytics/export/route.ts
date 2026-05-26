import { getServiceClient } from "@/lib/supabase/server";
import { getAdminSession, parseDateRange, unauthorizedResponse } from "@/lib/analytics/adminAuth";

const TABLE = "form_events";

function escape(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!(await getAdminSession(request))) return unauthorizedResponse();

  const { from, to } = parseDateRange(url);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: events, error } = await supabase
    .from(TABLE)
    .select("id, session_id, step_name, field_name, event_type, timestamp, metadata")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString())
    .order("timestamp", { ascending: true })
    .limit(50000);

  if (error) {
    if ((error as { code?: string }).code === "42P01") {
      return new Response("id,session_id,step_name,field_name,event_type,timestamp,device,browser\n", {
        headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=\"form-analytics-empty.csv\"" },
      });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = events ?? [];
  const header = ["id", "session_id", "step_name", "field_name", "event_type", "timestamp", "device", "browser"];
  const lines = [header.join(",")];

  for (const row of rows as Record<string, unknown>[]) {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    lines.push([
      escape(row.id),
      escape(row.session_id),
      escape(row.step_name),
      escape(row.field_name),
      escape(row.event_type),
      escape(row.timestamp),
      escape(meta.device),
      escape(meta.browser),
    ].join(","));
  }

  const csv = lines.join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": `attachment; filename="form-analytics-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
