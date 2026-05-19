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

  // One row per session: their first event carries device/browser in metadata
  const { data: events, error } = await supabase
    .from(TABLE)
    .select("session_id, event_type, metadata")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", to.toISOString())
    .order("timestamp", { ascending: true });

  if (error) {
    if ((error as { code?: string }).code === "42P01") {
      return Response.json({ devices: [], browsers: [], from: from.toISOString(), to: to.toISOString() });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  type Row = { session_id: string; event_type: string; metadata: Record<string, unknown> };

  // Track per-session: device, browser, and whether completed
  const sessionDevice  = new Map<string, string>();
  const sessionBrowser = new Map<string, string>();
  const sessionCompleted = new Set<string>();

  for (const row of (events ?? []) as Row[]) {
    const meta = row.metadata ?? {};
    if (!sessionDevice.has(row.session_id) && typeof meta.device === "string") {
      sessionDevice.set(row.session_id, meta.device);
    }
    if (!sessionBrowser.has(row.session_id) && typeof meta.browser === "string") {
      sessionBrowser.set(row.session_id, meta.browser);
    }
    if (row.event_type === "form_completed") {
      sessionCompleted.add(row.session_id);
    }
  }

  // Device breakdown
  const deviceMap = new Map<string, { total: number; completed: number }>();
  for (const [sid, device] of sessionDevice) {
    const prev = deviceMap.get(device) ?? { total: 0, completed: 0 };
    deviceMap.set(device, {
      total: prev.total + 1,
      completed: prev.completed + (sessionCompleted.has(sid) ? 1 : 0),
    });
  }

  // Browser breakdown
  const browserMap = new Map<string, { total: number; completed: number }>();
  for (const [sid, browser] of sessionBrowser) {
    const prev = browserMap.get(browser) ?? { total: 0, completed: 0 };
    browserMap.set(browser, {
      total: prev.total + 1,
      completed: prev.completed + (sessionCompleted.has(sid) ? 1 : 0),
    });
  }

  const devices = Array.from(deviceMap.entries()).map(([device, { total, completed }]) => ({
    device,
    total,
    completed,
    dropOff: total - completed,
  })).sort((a, b) => b.total - a.total);

  const browsers = Array.from(browserMap.entries()).map(([browser, { total, completed }]) => ({
    browser,
    total,
    completed,
    dropOff: total - completed,
  })).sort((a, b) => b.total - a.total);

  return Response.json({ devices, browsers, from: from.toISOString(), to: to.toISOString() });
}
