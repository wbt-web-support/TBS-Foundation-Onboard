import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/analytics/adminAuth";
import { mapRowToDetail } from "@/lib/admin/clients";
import { isSubmissionId } from "@/lib/admin/submissionId";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const { id } = await ctx.params;
  if (!isSubmissionId(id)) {
    return jsonError(
      "Invalid submission id. Open a client from the list (View), not the PDF download link.",
      400,
    );
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select(
      "id, resume_token, email, phone, tax_identification_number, current_section_index, answers, satisfaction_rating, completed, completion_pdf_filename, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Client not found", 404);

  return Response.json({ client: mapRowToDetail(data) });
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const { id } = await ctx.params;
  if (!isSubmissionId(id)) {
    return jsonError(
      "Invalid submission id. Open a client from the list (View), not the PDF download link.",
      400,
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return jsonError("Invalid body", 400);

  const patch: Record<string, unknown> = {};

  if ("email" in body) {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (email && !EMAIL_RE.test(email)) return jsonError("Invalid email", 400);
    patch.email = email || null;
  }
  if ("phone" in body) {
    patch.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  }
  if ("tax_identification_number" in body) {
    patch.tax_identification_number =
      typeof body.tax_identification_number === "string"
        ? body.tax_identification_number.trim() || null
        : null;
  }
  if ("completed" in body) {
    patch.completed = Boolean(body.completed);
  }

  if (Object.keys(patch).length === 0) return jsonError("No fields to update", 400);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .update(patch)
    .eq("id", id)
    .select(
      "id, resume_token, email, phone, tax_identification_number, current_section_index, answers, satisfaction_rating, completed, completion_pdf_filename, created_at, updated_at",
    )
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Client not found", 404);

  return Response.json({ client: mapRowToDetail(data) });
}

export async function DELETE(request: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthorized(request))) return unauthorizedResponse();

  const { id } = await ctx.params;
  if (!isSubmissionId(id)) {
    return jsonError(
      "Invalid submission id. Open a client from the list (View), not the PDF download link.",
      400,
    );
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const { error } = await supabase.from(SUBMISSIONS_TABLE).delete().eq("id", id);

  if (error) return jsonError(error.message, 500);

  return Response.json({ ok: true });
}
