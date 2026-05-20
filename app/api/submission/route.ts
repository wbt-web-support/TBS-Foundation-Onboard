import { getServiceClient, SUBMISSIONS_TABLE } from "@/lib/supabase/server";
import { sendCompletionReportWithPdf } from "@/lib/email/resend";
import { buildAndUploadCompletionPdf } from "@/lib/pdf/saveCompletionPdf";
import { FOUNDATION_COMPLETION_PDF_URL_KEY } from "@/lib/submission/foundationAppAnswersKey";
import { encodeCompletionPdfForDb } from "@/lib/admin/submissionPdf";
import { mergeAnswersForDatabase } from "@/lib/submission/persistAnswers";
import type { Answers, AutosavePayload, LoadSubmissionResponse, SubmissionResponse } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export type CompletionPdfArtifacts = {
  storedAnswers: Record<string, unknown>;
  pdfBuffer: Buffer | null;
  pdfFilename: string | null;
};

async function enrichStoredAnswersOnCompletion(
  appAnswers: Answers,
  submissionId: string,
  storedAnswers: Record<string, unknown>,
  email: string | null,
): Promise<CompletionPdfArtifacts> {
  try {
    const { buffer, filename, publicUrl } = await buildAndUploadCompletionPdf(appAnswers, submissionId);
    const next = { ...storedAnswers };
    if (publicUrl) next[FOUNDATION_COMPLETION_PDF_URL_KEY] = publicUrl;
    if (email && EMAIL_RE.test(email)) {
      void sendCompletionReportWithPdf(email, appAnswers, buffer, publicUrl).catch((err) => {
        console.error("[completion-pdf-email]", err);
      });
    }
    return { storedAnswers: next, pdfBuffer: buffer, pdfFilename: filename };
  } catch (err) {
    console.error("[completion-pdf-bunny]", err);
    if (email && EMAIL_RE.test(email)) {
      void sendCompletionReportWithPdf(email, appAnswers).catch((e) => {
        console.error("[completion-pdf-email]", e);
      });
    }
    return { storedAnswers, pdfBuffer: null, pdfFilename: null };
  }
}

// GET /api/submission?token=<resume_token> — load a saved submission.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !UUID_RE.test(token)) {
    return Response.json({ found: false } satisfies LoadSubmissionResponse);
  }
  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }
  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("id, resume_token, answers, current_section_index, completed")
    .eq("resume_token", token)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return Response.json({ found: false } satisfies LoadSubmissionResponse);

  return Response.json({
    found: true,
    submission: {
      id: data.id,
      resumeToken: data.resume_token,
      answers: data.answers ?? {},
      currentSectionIndex: data.current_section_index ?? 0,
      completed: Boolean(data.completed),
    },
  } satisfies LoadSubmissionResponse);
}

// POST /api/submission — upsert autosave. Body: AutosavePayload.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AutosavePayload | null;
  if (!body || typeof body !== "object") return jsonError("Invalid body", 400);

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return jsonError("Supabase not configured", 503);
  }

  const appAnswers = (body.answers ?? {}) as Answers;
  const completed = Boolean(body.completed);
  let storedAnswers = mergeAnswersForDatabase(appAnswers, body.sectionQuestionProgress);

  const row = {
    email: body.email ?? null,
    phone: body.phone ?? null,
    tax_identification_number: body.taxId ?? null,
    answers: storedAnswers,
    current_section_index:
      typeof body.currentSectionIndex === "number" ? body.currentSectionIndex : 0,
    satisfaction_rating:
      typeof body.satisfactionRating === "number" ? body.satisfactionRating : null,
    completed,
  };

  if (body.submissionId && UUID_RE.test(body.submissionId)) {
    let pdfBuffer: Buffer | null = null;
    let pdfFilename: string | null = null;

    if (completed) {
      const enriched = await enrichStoredAnswersOnCompletion(
        appAnswers,
        body.submissionId,
        storedAnswers,
        row.email,
      );
      storedAnswers = enriched.storedAnswers;
      pdfBuffer = enriched.pdfBuffer;
      pdfFilename = enriched.pdfFilename;
      row.answers = storedAnswers;
    }

    const updatePayload: Record<string, unknown> = { ...row };
    if (completed && pdfBuffer) {
      updatePayload.completion_pdf = encodeCompletionPdfForDb(pdfBuffer);
      updatePayload.completion_pdf_filename = pdfFilename;
    }

    const { data, error } = await supabase
      .from(SUBMISSIONS_TABLE)
      .update(updatePayload)
      .eq("id", body.submissionId)
      .select("id, resume_token")
      .maybeSingle();
    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Submission not found", 404);
    return Response.json({ id: data.id, resumeToken: data.resume_token } satisfies SubmissionResponse);
  }

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .insert(row)
    .select("id, resume_token")
    .single();
  if (error) return jsonError(error.message, 500);

  if (completed && data.id) {
    const enriched = await enrichStoredAnswersOnCompletion(appAnswers, data.id, storedAnswers, row.email);
    const patch: Record<string, unknown> = { answers: enriched.storedAnswers };
    if (enriched.pdfBuffer) {
      patch.completion_pdf = encodeCompletionPdfForDb(enriched.pdfBuffer);
      patch.completion_pdf_filename = enriched.pdfFilename;
    }
    await supabase.from(SUBMISSIONS_TABLE).update(patch).eq("id", data.id);
  }

  return Response.json({ id: data.id, resumeToken: data.resume_token } satisfies SubmissionResponse);
}
