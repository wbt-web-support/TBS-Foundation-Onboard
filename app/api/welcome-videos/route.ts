import { getServiceClient } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ videos: [] });
  }

  const { data } = await supabase
    .from("welcome_videos")
    .select("id, title, description, url, video_type, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return Response.json({ videos: data ?? [] });
}
