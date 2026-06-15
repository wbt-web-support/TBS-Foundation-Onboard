import { getServiceClient } from "@/lib/supabase/server";

export const revalidate = 60;

type VideoRow = {
  id: string;
  title: string;
  description: string;
  url: string;
  video_type: string;
  sort_order: number;
};

// Welcome videos change rarely (admin-edited). Cache in-process so a slow
// Supabase round-trip happens at most once per TTL per server instance,
// instead of on every page load.
const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; videos: VideoRow[] } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return Response.json({ videos: cache.videos });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ videos: [] });
  }

  const { data, error } = await supabase
    .from("welcome_videos")
    .select("id, title, description, url, video_type, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  // Never cache a failure (e.g. Supabase paused / network error) — otherwise an
  // empty list would be served for the whole TTL even after the DB comes back.
  if (error) {
    console.error("[welcome-videos]", error.message);
    return Response.json({ videos: [] }, { status: 200 });
  }

  const videos = (data ?? []) as VideoRow[];
  cache = { at: Date.now(), videos };

  return Response.json(
    { videos },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
