import { getServiceClient } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body", 400);

  let supabase;
  try { supabase = getServiceClient(); } catch { return jsonError("Supabase not configured", 503); }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined)       patch.title       = String(body.title).trim();
  if (body.description !== undefined) patch.description = String(body.description).trim();
  if (body.url !== undefined)         patch.url         = String(body.url).trim();
  if (body.video_type !== undefined)  patch.video_type  = String(body.video_type);
  if (body.sort_order !== undefined)  patch.sort_order  = Number(body.sort_order);
  if (body.active !== undefined)      patch.active      = Boolean(body.active);

  const { data, error } = await supabase
    .from("welcome_videos")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Video not found", 404);
  return Response.json({ video: data });
}

export async function DELETE(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();
  const { id } = await ctx.params;

  let supabase;
  try { supabase = getServiceClient(); } catch { return jsonError("Supabase not configured", 503); }

  const { error } = await supabase.from("welcome_videos").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return Response.json({ ok: true });
}
