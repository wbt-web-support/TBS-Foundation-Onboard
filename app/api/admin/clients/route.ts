import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";
import { mapRowToListItem } from "@/lib/admin/clients";

const LIST_COLUMNS =
  "id, resume_token, ref_id, email, phone, tax_identification_number, current_section_index, answers, satisfaction_rating, completed, completion_pdf_filename, created_at, updated_at";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const url = new URL(request.url);
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const completedParam = url.searchParams.get("completed");
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 200));

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let query = supabase
    .from(SUBMISSIONS_TABLE)
    .select(LIST_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `email.ilike.${pattern},phone.ilike.${pattern},tax_identification_number.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    if ((error as { code?: string }).code === "42P01") {
      return Response.json({
        clients: [],
        total: 0,
        stats: { total: 0, completed: 0, inProgress: 0 },
      });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  let clients = (data ?? []).map((row) => mapRowToListItem(row));

  if (completedParam === "true") {
    clients = clients.filter((c) => c.completed || c.percentComplete >= 100);
  } else if (completedParam === "false") {
    clients = clients.filter((c) => !c.completed && c.percentComplete < 100);
  }

  if (search) {
    clients = clients.filter((c) => {
      const hay = [
        c.companyName,
        c.email,
        c.phone,
        c.taxId,
        c.currentSectionName,
        c.currentQuestionTitle,
        c.id,
        c.resumeToken,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(search);
    });
  }

  const stats = {
    total: clients.length,
    completed: clients.filter((c) => c.completed || c.percentComplete >= 100).length,
    inProgress: clients.filter((c) => !c.completed && c.percentComplete < 100).length,
  };

  return Response.json({ clients, total: clients.length, stats });
}
