import { asStringOrNull, getByPath, isProvideLaterSentinel } from "@/lib/answers";
import { ADMIN_NOTES_KEY } from "@/lib/submission/foundationAppAnswersKey";
import { getBunnyCompletionPdfUrl } from "@/lib/admin/completionPdf";
import { collectUploadDocuments, fileKindFromUrl, looksLikeUploadedFile } from "@/lib/admin/collectUploads";
import { computeClientFormProgress } from "@/lib/admin/progress";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { getVisibleStandaloneQuestions, getVisibleSubQuestions, isQuestionVisible } from "@/lib/schema/visibility";
import type { Question, SubQuestion } from "@/lib/schema/types";
import { extractAppAnswersFromDatabase } from "@/lib/submission/persistAnswers";
import type { AnswerValue, Answers, FieldGroupAnswer, RepeatableAnswer } from "@/lib/types";

export type ClientDocument = {
  id: string;
  label: string;
  url: string;
  kind: "pdf" | "image" | "file";
  sectionName: string | null;
  questionId: string | null;
  questionLabel: string | null;
};

/** Mirrors `onboarding_submissions` row (admin-safe; no PDF bytes). */
export type ClientSubmissionRecord = {
  id: string;
  resumeToken: string;
  refId: number | null;
  email: string | null;
  phone: string | null;
  taxIdentificationNumber: string | null;
  currentSectionIndex: number;
  satisfactionRating: number | null;
  completed: boolean;
  completionPdfFilename: string | null;
  hasCompletionPdf: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientListItem = {
  id: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  completed: boolean;
  pdfUrl: string | null;
  hasStoredPdf: boolean;
  canDownloadPdf: boolean;
  completionPdfFilename: string | null;
  documentCount: number;
  imageCount: number;
  currentSectionIndex: number;
  totalQuestions: number;
  filledQuestions: number;
  percentComplete: number;
  currentQuestionTitle: string | null;
  currentSectionName: string | null;
  satisfactionRating: number | null;
  resumeToken: string;
  refId: number | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  adminNotes: string | null;
  record: ClientSubmissionRecord;
};

export type ClientDetailField = {
  label: string;
  value: string;
  href?: string;
};

export type ClientDetailSection = {
  title: string;
  fields: ClientDetailField[];
};

export type ClientDetail = ClientListItem & {
  resumeToken: string;
  satisfactionRating: number | null;
  documents: ClientDocument[];
  sections: ClientDetailSection[];
};

type DbRow = {
  id: string;
  resume_token: string;
  ref_id: number | null;
  email: string | null;
  phone: string | null;
  tax_identification_number: string | null;
  current_section_index: number;
  answers: Record<string, unknown> | null;
  satisfaction_rating: number | null;
  completed: boolean;
  completion_pdf?: string | null;
  completion_pdf_filename?: string | null;
  created_at: string;
  updated_at: string;
};

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

function fileKind(url: string): ClientDocument["kind"] {
  return fileKindFromUrl(url);
}

function companyNameFromAnswers(answers: Answers): string {
  const cd = answers.company_details;
  if (cd && typeof cd === "object" && !Array.isArray(cd)) {
    const name = asStringOrNull((cd as FieldGroupAnswer).company_name);
    if (name) return name;
  }
  return "—";
}

function formatScalar(options: Question["options"], value: AnswerValue | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    if (isProvideLaterSentinel(value)) return "I will provide later";
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length && typeof value[0] === "string") {
      return (value as string[])
        .map((v) => options?.find((o) => o.value === v)?.label ?? v)
        .join(", ");
    }
    return "";
  }
  const o = value as Record<string, unknown>;
  if ("open" in o && "close" in o) {
    const tr = value as { open: string; close: string; saturdayOpen?: boolean; sundayOpen?: boolean; alwaysOpen?: boolean };
    const parts = [`${tr.open} – ${tr.close}`];
    if (tr.alwaysOpen) parts.push("Always open");
    else {
      if (tr.saturdayOpen) parts.push("Saturday open");
      if (tr.sundayOpen) parts.push("Sunday open");
    }
    return parts.join("; ");
  }
  return "";
}

function questionTitle(q: Question): string {
  if (q.titleRich?.length) return q.titleRich.map((s) => s.text).join("");
  return q.title;
}

function collectDocuments(
  stored: Record<string, unknown>,
  appAnswers: Answers,
  submissionId: string,
  hasStoredPdf: boolean,
  completed: boolean,
): ClientDocument[] {
  const bunnyPdfUrl = getBunnyCompletionPdfUrl(stored);
  const extra: ClientDocument[] = [];

  if (bunnyPdfUrl) {
    extra.push({
      id: "completion-pdf-bunny",
      label: "Submission PDF",
      url: bunnyPdfUrl,
      kind: "pdf",
      sectionName: "After submission",
      questionId: null,
      questionLabel: "Same PDF as in the completion email",
    });
  } else if (hasStoredPdf || completed) {
    extra.push({
      id: "completion-pdf-api",
      label: "Submission PDF",
      url: `/api/admin/clients/${submissionId}/pdf`,
      kind: "pdf",
      sectionName: "After submission",
      questionId: null,
      questionLabel: hasStoredPdf
        ? "Saved when the form was submitted"
        : "Generated from saved form answers",
    });
  }

  return collectUploadDocuments({ stored, appAnswers, extraDocs: extra });
}

function buildDetailSections(answers: Answers): ClientDetailSection[] {
  const sections: ClientDetailSection[] = [];

  for (const section of ONBOARDING_SCHEMA.sections) {
    const fields: ClientDetailField[] = [];

    for (const q of getVisibleStandaloneQuestions(section, answers)) {
      if (!isQuestionVisible(q, answers)) continue;
      const v = answers[q.id];
      if (v === undefined || v === null) continue;

      if (q.type === "field-group") {
        if (!v || typeof v !== "object" || Array.isArray(v)) continue;
        const card = v as FieldGroupAnswer;
        for (const sub of getVisibleSubQuestions(q, answers, card)) {
          const sv = card[sub.id];
          const text = formatScalar(sub.options, sv as AnswerValue);
          if (!text) continue;
          const field: ClientDetailField = { label: sub.title, value: text };
          if (typeof sv === "string" && isHttpUrl(sv)) field.href = sv;
          fields.push(field);
        }
        continue;
      }

      if (q.type === "repeatable-group") {
        if (!Array.isArray(v)) continue;
        (v as RepeatableAnswer).forEach((card, idx) => {
          for (const sub of getVisibleSubQuestions(q, answers, card)) {
            const sv = card[sub.id];
            const text = formatScalar(sub.options, sv as AnswerValue);
            if (!text) continue;
            fields.push({
              label: `${q.groupItemLabel ?? "Entry"} ${idx + 1} — ${sub.title}`,
              value: text,
              href: typeof sv === "string" && isHttpUrl(sv) ? sv : undefined,
            });
          }
        });
        continue;
      }

      if (q.type === "file") {
        const url = asStringOrNull(v as AnswerValue);
        if (!url) continue;
        fields.push({
          label: questionTitle(q),
          value: url.split("/").pop() ?? "Uploaded file",
          href: url,
        });
        continue;
      }

      const text = formatScalar(q.options, v as AnswerValue);
      if (!text) continue;
      const field: ClientDetailField = { label: questionTitle(q), value: text };
      if (typeof v === "string" && isHttpUrl(v)) field.href = v;
      fields.push(field);
    }

    if (fields.length > 0) {
      sections.push({ title: section.heading ?? section.id, fields });
    }
  }

  return sections;
}

function hasDbPdf(row: DbRow): boolean {
  if (row.completion_pdf_filename?.trim()) return true;
  const raw = row.completion_pdf;
  if (!raw) return false;
  if (typeof raw === "string" && raw.length > 0) return true;
  return false;
}

function buildSubmissionRecord(row: DbRow): ClientSubmissionRecord {
  return {
    id: row.id,
    resumeToken: row.resume_token,
    refId: row.ref_id ?? null,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    taxIdentificationNumber: row.tax_identification_number?.trim() || null,
    currentSectionIndex: row.current_section_index ?? 0,
    satisfactionRating: row.satisfaction_rating,
    completed: Boolean(row.completed),
    completionPdfFilename: row.completion_pdf_filename?.trim() || null,
    hasCompletionPdf: hasDbPdf(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowToListItem(row: DbRow): ClientListItem {
  const stored = (row.answers ?? {}) as Record<string, unknown>;
  const appAnswers = extractAppAnswersFromDatabase(stored);
  const pdfUrl = getBunnyCompletionPdfUrl(stored);
  const storedPdf = hasDbPdf(row);
  const documents = collectDocuments(stored, appAnswers, row.id, storedPdf, Boolean(row.completed));
  const progress = computeClientFormProgress(
    appAnswers,
    row.current_section_index ?? 0,
    Boolean(row.completed),
  );

  const email =
    row.email?.trim() ||
    asStringOrNull(getByPath(appAnswers, ONBOARDING_SCHEMA.keyFields.email)) ||
    null;
  const phone =
    row.phone?.trim() ||
    asStringOrNull(getByPath(appAnswers, ONBOARDING_SCHEMA.keyFields.phone)) ||
    null;
  const taxId =
    row.tax_identification_number?.trim() ||
    asStringOrNull(getByPath(appAnswers, ONBOARDING_SCHEMA.keyFields.taxId)) ||
    null;

  const companyName = companyNameFromAnswers(appAnswers);
  const name = companyName === "—" ? (email ?? "Unnamed client") : companyName;

  const record = buildSubmissionRecord(row);

  return {
    id: row.id,
    companyName: name,
    email,
    phone,
    taxId,
    completed: Boolean(row.completed),
    pdfUrl,
    hasStoredPdf: storedPdf,
    canDownloadPdf: Boolean(row.completed) || progress.percentComplete >= 100,
    completionPdfFilename: record.completionPdfFilename,
    documentCount: documents.length,
    imageCount: documents.filter((d) => d.kind === "image").length,
    currentSectionIndex: row.current_section_index ?? 0,
    totalQuestions: progress.totalQuestions,
    filledQuestions: progress.filledQuestions,
    percentComplete: progress.percentComplete,
    currentQuestionTitle: progress.currentQuestionTitle,
    currentSectionName: progress.currentSectionName,
    satisfactionRating: row.satisfaction_rating,
    resumeToken: row.resume_token,
    refId: row.ref_id ?? null,
    lastActivityAt: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    adminNotes: typeof stored[ADMIN_NOTES_KEY] === "string" ? (stored[ADMIN_NOTES_KEY] as string) || null : null,
    record,
  };
}

export function mapRowToDetail(row: DbRow): ClientDetail {
  const stored = (row.answers ?? {}) as Record<string, unknown>;
  const appAnswers = extractAppAnswersFromDatabase(stored);
  const list = mapRowToListItem(row);

  return {
    ...list,
    resumeToken: row.resume_token,
    satisfactionRating: row.satisfaction_rating,
    documents: collectDocuments(stored, appAnswers, row.id, hasDbPdf(row), Boolean(row.completed)),
    sections: buildDetailSections(appAnswers),
    record: buildSubmissionRecord(row),
  };
}
