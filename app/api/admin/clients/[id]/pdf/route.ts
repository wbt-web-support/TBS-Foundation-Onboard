import { getBunnyCompletionPdfUrl } from "@/lib/admin/completionPdf";
import { isSubmissionId } from "@/lib/admin/submissionId";
import { getAdminSession, unauthorizedResponse } from "@/lib/analytics/adminAuth";
import { buildOnboardingAnswersPdfBuffer, completionPdfFilename } from "@/lib/pdf/onboardingAnswersPdf";
import { extractAppAnswersFromDatabase } from "@/lib/submission/persistAnswers";
import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";

function bufferFromDbValue(raw: unknown): Buffer | null {
  if (!raw) return null;
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  if (typeof raw === "string") {
    if (raw.startsWith("\\x")) return Buffer.from(raw.slice(2), "hex");
    return Buffer.from(raw, "base64");
  }
  return null;
}

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length > 4 && buf.slice(0, 5).toString("ascii") === "%PDF-";
}

type RouteCtx = { params: Promise<{ id: string }> };

/** GET /api/admin/clients/[id]/pdf — submission PDF (Bunny CDN first, same as email; then DB; then regenerate). */
export async function GET(request: Request, ctx: RouteCtx) {
  if (!(await getAdminSession(request))) return unauthorizedResponse();

  const { id } = await ctx.params;
  if (!isSubmissionId(id)) {
    return Response.json({ error: "Invalid submission id" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("completion_pdf, completion_pdf_filename, answers, completed")
    .eq("id", id)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Client not found" }, { status: 404 });

  const stored = (data.answers ?? {}) as Record<string, unknown>;
  const bunnyPdfUrl = getBunnyCompletionPdfUrl(stored);

  let buffer: Buffer | null = null;
  let filename =
    typeof data.completion_pdf_filename === "string" && data.completion_pdf_filename
      ? data.completion_pdf_filename
      : "onboarding-completion.pdf";

  if (bunnyPdfUrl) {
    try {
      const cdnRes = await fetch(bunnyPdfUrl, { cache: "no-store" });
      if (cdnRes.ok) {
        buffer = Buffer.from(await cdnRes.arrayBuffer());
        const fromUrl = bunnyPdfUrl.split("/").pop()?.split("?")[0];
        if (fromUrl?.toLowerCase().endsWith(".pdf")) filename = decodeURIComponent(fromUrl);
      }
    } catch {
      /* fall through to DB / regenerate */
    }
  }

  if (!buffer) {
    const fromDb = bufferFromDbValue(data.completion_pdf);
    if (fromDb && isPdfBuffer(fromDb)) buffer = fromDb;
  }

  if (!buffer) {
    if (!data.completed) {
      return Response.json({ error: "PDF not available — form not completed" }, { status: 404 });
    }
    const appAnswers = extractAppAnswersFromDatabase(stored);
    buffer = await buildOnboardingAnswersPdfBuffer(appAnswers);
    filename = completionPdfFilename(appAnswers);
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
