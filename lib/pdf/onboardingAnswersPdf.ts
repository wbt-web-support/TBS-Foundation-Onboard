import PDFDocument from "pdfkit";
import {
  asStringOrNull,
  getByPath,
  isFieldGroupKickoffDeferred,
  isProvideLaterSentinel,
} from "@/lib/answers";
import { GALLERIES } from "@/lib/schema/galleries";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { getVisibleStandaloneQuestions, getVisibleSubQuestions, isQuestionVisible } from "@/lib/schema/visibility";
import type { GalleryOption, Option, Question } from "@/lib/schema/types";
import type { AnswerValue, Answers, FieldGroupAnswer, RepeatableAnswer, TimeRangeAnswer } from "@/lib/types";

function plainQuestionTitle(q: Question): string {
  if (q.titleRich?.length) {
    return q.titleRich.map((s) => (s.type === "text" ? s.text : s.text)).join("");
  }
  return q.title;
}

function galleryOptionsFor(q: Question): GalleryOption[] {
  if (q.galleryOptions?.length) return q.galleryOptions;
  if (q.galleryKey && GALLERIES[q.galleryKey]) return GALLERIES[q.galleryKey]!;
  return [];
}

function optionLabel(options: Option[] | undefined, value: string): string {
  const o = options?.find((x) => x.value === value);
  return o?.label ?? value;
}

function formatTimeRange(tr: TimeRangeAnswer): string {
  const parts = [`${tr.open} – ${tr.close}`];
  if (tr.alwaysOpen) parts.push("Always open");
  else {
    if (tr.saturdayOpen) parts.push("Sat open");
    if (tr.sundayOpen) parts.push("Sun open");
  }
  return parts.join("; ");
}

function formatScalarish(
  options: Option[] | undefined,
  yearRange: { from: number; to: number } | undefined,
  value: AnswerValue | undefined,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    if (isProvideLaterSentinel(value)) return "I will provide later";
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length && typeof value[0] === "string") {
      return (value as string[]).map((v) => optionLabel(options, v)).join(", ");
    }
    return "";
  }
  const o = value as Record<string, unknown>;
  if ("open" in o && "close" in o) return formatTimeRange(value as TimeRangeAnswer);
  return "";
}

function formatFieldGroup(q: Question, answers: Answers): string {
  const raw = answers[q.id];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  if (isFieldGroupKickoffDeferred(raw)) return "Details to be provided at kick-off meeting";
  const card = raw as FieldGroupAnswer;
  const lines: string[] = [];
  for (const sub of getVisibleSubQuestions(q, answers, card)) {
    const v = card[sub.id];
    if (v === undefined || v === null || v === "") continue;
    const line = `${sub.title}\n${formatScalarish(sub.options, sub.yearRange, v as AnswerValue)}`;
    lines.push(line);
  }
  return lines.join("\n\n");
}

function formatRepeatable(q: Question, answers: Answers): string {
  const raw = answers[q.id];
  if (!Array.isArray(raw)) return "";
  const rows = raw as RepeatableAnswer;
  if (rows.length === 0) return "";
  return rows
    .map((card, idx) => {
      const lines: string[] = [];
      for (const sub of getVisibleSubQuestions(q, answers, card)) {
        const v = card[sub.id];
        if (v === undefined || v === null || v === "") continue;
        lines.push(`${sub.title}: ${formatScalarish(sub.options, sub.yearRange, v as AnswerValue)}`);
      }
      return lines.length ? `${q.groupItemLabel ?? "Entry"} ${idx + 1}\n${lines.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function formatImageGallery(q: Question, value: AnswerValue | undefined): string {
  const opts = galleryOptionsFor(q);
  const ids = Array.isArray(value) ? (value as string[]).filter((x) => typeof x === "string") : [];
  if (ids.length === 0) return "";
  return ids
    .map((id) => {
      const g = opts.find((o) => o.id === id);
      const label = g?.label ?? id;
      const url = g?.imageUrl?.trim();
      return url ? `${label}\n${url}` : label;
    })
    .join("\n\n");
}

function formatQuestionBlock(q: Question, answers: Answers): string {
  if (!isQuestionVisible(q, answers)) return "";
  const v = answers[q.id];
  if (v === undefined || v === null) return "";

  switch (q.type) {
    case "field-group":
      return formatFieldGroup(q, answers);
    case "repeatable-group":
      return formatRepeatable(q, answers);
    case "image-gallery-pick":
      return formatImageGallery(q, v);
    case "multi-choice":
      if (Array.isArray(v) && v.length === 0) return "";
      return formatScalarish(q.options, undefined, v);
    case "single-choice": {
      const main = formatScalarish(q.options, undefined, v);
      const extraId = q.otherTextAnswerId;
      if (extraId) {
        const extra = asStringOrNull(getByPath(answers, extraId));
        if (extra) return `${main}\n${extra}`;
      }
      return main;
    }
    default:
      return formatScalarish(q.options, q.yearRange, v);
  }
}

/** Builds a text report PDF similar to legacy “pdfreport” exports: section blocks and `-- n of m --` markers. */
export function buildOnboardingAnswersPdfBuffer(answers: Answers): Promise<Buffer> {
  const contentSections = ONBOARDING_SCHEMA.sections.filter((s) => s.kind === "questions" && s.questions.length > 0);
  const total = contentSections.length;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => {
      chunks.push(c);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    doc.font("Helvetica").fontSize(10);

    let idx = 0;
    for (const section of contentSections) {
      idx += 1;
      const heading = section.heading ?? section.title;
      doc.font("Helvetica-Bold").fontSize(14).text(heading, { paragraphGap: 4 });
      doc.moveDown(0.25);
      doc.font("Helvetica").fontSize(10);

      const questions = getVisibleStandaloneQuestions(section, answers);
      for (const q of questions) {
        const body = formatQuestionBlock(q, answers);
        if (!body.trim()) continue;
        doc.font("Helvetica-Bold").fontSize(10).text(plainQuestionTitle(q));
        doc.font("Helvetica").fontSize(10).text(body, { paragraphGap: 2, align: "left" });
        doc.moveDown(0.35);
      }

      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(9).fillColor("#555555").text(`-- ${idx} of ${total} --`, {
        align: "center",
      });
      doc.fillColor("#000000");
      doc.moveDown(1);
    }

    doc.end();
  });
}

export function completionPdfFilename(answers: Answers): string {
  const company =
    asStringOrNull(getByPath(answers, "company_details.company_name"))?.replace(/[^\w\-]+/g, "_").slice(0, 40) ||
    "foundation-onboard";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `pdfreport_${stamp}_${company}.pdf`;
}
