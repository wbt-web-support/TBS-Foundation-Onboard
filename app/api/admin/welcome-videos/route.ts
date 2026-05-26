import { getServiceClient } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();
  let supabase;
  try { supabase = getServiceClient(); } catch { return jsonError("Supabase not configured", 503); }

  const { data, error } = await supabase
    .from("welcome_videos")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return Response.json({ videos: data ?? [] });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  if (!body?.title?.trim()) return jsonError("title is required", 400);

  let supabase;
  try { supabase = getServiceClient(); } catch { return jsonError("Supabase not configured", 503); }

  const { data: maxRow } = await supabase
    .from("welcome_videos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("welcome_videos")
    .insert({
      title: body.title.trim(),
      description: (body.description ?? "").trim(),
      url: (body.url ?? "").trim(),
      video_type: body.video_type ?? "custom",
      sort_order: (maxRow?.sort_order ?? -1) + 1,
      active: body.active !== false,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return Response.json({ video: data }, { status: 201 });
}
