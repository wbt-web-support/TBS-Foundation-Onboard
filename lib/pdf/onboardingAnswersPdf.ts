import PDFDocument from "pdfkit";
import { loadWbtLogoBuffer } from "@/lib/brand/wbtLogo";
import {
  asStringOrNull,
  getByPath,
  isFieldGroupKickoffDeferred,
  isProvideLaterSentinel,
} from "@/lib/answers";
import { GALLERIES } from "@/lib/schema/galleries";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { getVisibleStandaloneQuestions, getVisibleSubQuestions, isQuestionVisible } from "@/lib/schema/visibility";
import type { GalleryOption, Option, Question, Section } from "@/lib/schema/types";
import type { AnswerValue, Answers, FieldGroupAnswer, RepeatableAnswer, TimeRangeAnswer } from "@/lib/types";

const MARGIN = 40;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;
const GAP = 12;
const CARD_RADIUS = 8;
const HEADER_H = 56;
const SECTION_BAR_H = 32;
const ICON_SIZE = 14;

const COLOR = {
  headerCardBg: "#f4f6f8",
  headerCardBorder: "#e2e8f0",
  sectionBar: "#1a4d5e",
  cellBg: "#f8f9fa",
  cellBorder: "#e2e8f0",
  icon: "#64748b",
  label: "#0f172a",
  value: "#334155",
  footer: "#64748b",
  white: "#ffffff",
  page: "#ffffff",
};

type FieldIcon = "building" | "phone" | "email" | "person" | "default";

type PdfField = { label: string; value: string; colSpan?: 1 | 2; icon?: FieldIcon };

function iconForLabel(label: string): FieldIcon {
  const l = label.toLowerCase();
  if (l.includes("email")) return "email";
  if (l.includes("phone") || l.includes("contact")) return "phone";
  if (l.includes("owner")) return "person";
  if (l.includes("company") || l.includes("reg") || l.includes("tax") || l.includes("type")) return "building";
  return "default";
}

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

function fg(answers: Answers, id: string): FieldGroupAnswer {
  const v = answers[id];
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as FieldGroupAnswer;
  }
  return {};
}

function fgStr(card: FieldGroupAnswer, key: string): string {
  const v = card[key];
  return typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
}

function orgTypeLabel(answers: Answers): string {
  const raw = fgStr(fg(answers, "company_details"), "org_type");
  if (!raw) return "";
  const q = ONBOARDING_SCHEMA.sections
    .flatMap((s) => s.questions)
    .find((x) => x.id === "company_details");
  const sub = q?.group?.find((g) => g.id === "org_type");
  return optionLabel(sub?.options, raw) || raw;
}

function companySectionFields(answers: Answers): PdfField[] {
  const details = fg(answers, "company_details");
  const name = fg(answers, "your_name");
  const legacyContact = fg(answers, "company_contact");
  const owner = [fgStr(name, "first_name"), fgStr(name, "last_name")].filter(Boolean).join(" ");

  return [
    { label: "Company Name", value: fgStr(details, "company_name") || "—", icon: "building" },
    { label: "Company Type", value: orgTypeLabel(answers) || "—", icon: "building" },
    {
      label: "Company Reg. Number",
      value: fgStr(details, "company_registration_number") || "—",
      icon: "building",
    },
    {
      label: "Company Tax Number",
      value: fgStr(details, "tax_identification_number") || "—",
      icon: "building",
    },
    { label: "Owner Name", value: owner || "—", icon: "person" },
    {
      label: "Contact number",
      value: fgStr(details, "company_landline") || fgStr(legacyContact, "company_landline") || "—",
      icon: "phone",
    },
    {
      label: "Business Email",
      value: fgStr(details, "business_email") || fgStr(legacyContact, "business_email") || "—",
      icon: "email",
    },
    {
      label: "Phone",
      value: fgStr(details, "phone_number") || fgStr(legacyContact, "phone_number") || "—",
      icon: "phone",
    },
  ];
}

function formatQuestionBlock(q: Question, answers: Answers): string {
  if (!isQuestionVisible(q, answers)) return "";
  const v = answers[q.id];
  if (v === undefined || v === null) return "";

  switch (q.type) {
    case "field-group": {
      const raw = v;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
      if (isFieldGroupKickoffDeferred(raw)) return "Details to be provided at kick-off meeting";
      const card = raw as FieldGroupAnswer;
      const lines: string[] = [];
      for (const sub of getVisibleSubQuestions(q, answers, card)) {
        const sv = card[sub.id];
        if (sv === undefined || sv === null || sv === "") continue;
        lines.push(`${sub.title}: ${formatScalarish(sub.options, sv as AnswerValue)}`);
      }
      return lines.join("\n");
    }
    case "repeatable-group": {
      if (isProvideLaterSentinel(v)) return "I will provide later";
      if (!Array.isArray(v)) return "";
      const rows = v as RepeatableAnswer;
      return rows
        .map((card, idx) => {
          const lines: string[] = [];
          for (const sub of getVisibleSubQuestions(q, answers, card)) {
            const sv = card[sub.id];
            if (sv === undefined || sv === null || sv === "") continue;
            lines.push(`${sub.title}: ${formatScalarish(sub.options, sv as AnswerValue)}`);
          }
          return lines.length ? `${q.groupItemLabel ?? "Entry"} ${idx + 1}: ${lines.join("; ")}` : "";
        })
        .filter(Boolean)
        .join("\n\n");
    }
    case "image-gallery-pick": {
      const opts = galleryOptionsFor(q);
      const ids = Array.isArray(v) ? (v as string[]).filter((x) => typeof x === "string") : [];
      if (!ids.length) return typeof v === "string" ? formatScalarish(undefined, v) : "";
      return ids
        .map((id) => {
          const g = opts.find((o) => o.id === id);
          return g?.label ?? id;
        })
        .join(", ");
    }
    default:
      return formatScalarish(q.options, v);
  }
}

function sectionFieldsFromQuestions(section: Section, answers: Answers): PdfField[] {
  const fields: PdfField[] = [];
  for (const q of getVisibleStandaloneQuestions(section, answers)) {
    if (q.id === "company_details" || q.id === "your_name") continue;
    const body = formatQuestionBlock(q, answers);
    if (!body.trim()) continue;
    const isLong = body.length > 120 || body.includes("\n");
    const label = plainQuestionTitle(q);
    fields.push({
      label,
      value: body,
      colSpan: isLong ? 2 : 1,
      icon: iconForLabel(label),
    });
  }
  return fields;
}

function drawFieldIcon(doc: PDFKit.PDFDocument, x: number, y: number, icon: FieldIcon): void {
  doc.save();
  doc.strokeColor(COLOR.icon).lineWidth(1.2);
  const cx = x + ICON_SIZE / 2;
  const cy = y + ICON_SIZE / 2;

  switch (icon) {
    case "building":
      doc
        .rect(x + 2, y + 5, ICON_SIZE - 4, ICON_SIZE - 6)
        .stroke();
      doc
        .moveTo(x + 1, y + 5)
        .lineTo(cx, y + 1)
        .lineTo(x + ICON_SIZE - 1, y + 5)
        .stroke();
      break;
    case "phone":
      doc.roundedRect(x + 3, y + 2, ICON_SIZE - 6, ICON_SIZE - 3, 2).stroke();
      doc.moveTo(cx, y + ICON_SIZE - 2).lineTo(cx, y + ICON_SIZE + 1).stroke();
      break;
    case "email":
      doc.rect(x + 1, y + 4, ICON_SIZE - 2, ICON_SIZE - 7).stroke();
      doc.moveTo(x + 1, y + 4).lineTo(cx, y + 9).lineTo(x + ICON_SIZE - 1, y + 4).stroke();
      break;
    case "person":
      doc.circle(cx, y + 4, 3).stroke();
      doc.moveTo(x + 3, y + ICON_SIZE).lineTo(x + ICON_SIZE - 3, y + ICON_SIZE).stroke();
      break;
    default:
      doc.circle(cx, cy, 4).stroke();
      break;
  }
  doc.restore();
}

function cardHeight(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  width: number,
): number {
  const pad = 12;
  const labelW = width - pad * 2 - ICON_SIZE - 6;
  const valueW = width - pad * 2;
  doc.font("Helvetica-Bold").fontSize(9);
  const labelH = doc.heightOfString(label, { width: labelW });
  doc.font("Helvetica").fontSize(10);
  const valueH = doc.heightOfString(value || "—", { width: valueW });
  return Math.max(52, pad + labelH + 8 + valueH + pad);
}

function stampPageFooters(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLOR.footer)
      .text(`— ${i + 1} of ${total} —`, MARGIN, doc.page.height - MARGIN - 6, {
        width: CONTENT_W,
        align: "center",
      });
    doc.fillColor("#000000");
  }
}

function collectSectionFields(section: Section, answers: Answers): PdfField[] {
  if (section.id === "company") {
    const fields = companySectionFields(answers);
    const extra = sectionFieldsFromQuestions(section, answers);
    return extra.length ? [...fields, ...extra] : fields;
  }
  return sectionFieldsFromQuestions(section, answers);
}

function drawCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  icon: FieldIcon,
): void {
  const pad = 12;
  doc.save();
  doc.roundedRect(x, y, w, h, CARD_RADIUS).fillAndStroke(COLOR.cellBg, COLOR.cellBorder);

  const iconX = x + pad;
  const iconY = y + pad;
  drawFieldIcon(doc, iconX, iconY, icon);

  const labelX = x + pad + ICON_SIZE + 6;
  const labelW = w - pad * 2 - ICON_SIZE - 6;
  doc.fillColor(COLOR.label).font("Helvetica-Bold").fontSize(9).text(label, labelX, y + pad - 1, {
    width: labelW,
  });
  const labelH = doc.heightOfString(label, { width: labelW });
  const valueY = y + pad + Math.max(labelH, ICON_SIZE) + 6;
  doc
    .fillColor(COLOR.value)
    .font("Helvetica")
    .fontSize(10)
    .text(value || "—", x + pad, valueY, { width: w - pad * 2, lineGap: 2 });

  doc.restore();
  doc.fillColor("#000000");
}

/** Light rounded header card with logo (reference layout). */
function drawPageHeader(doc: PDFKit.PDFDocument, logo: Buffer | null, y: number): number {
  doc.save();
  doc.roundedRect(MARGIN, y, CONTENT_W, HEADER_H, CARD_RADIUS).fillAndStroke(
    COLOR.headerCardBg,
    COLOR.headerCardBorder,
  );
  if (logo) {
    try {
      doc.image(logo, MARGIN + 14, y + 10, { fit: [200, 36] });
    } catch {
      doc
        .fillColor(COLOR.label)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("We Build Trades", MARGIN + 14, y + 20);
    }
  } else {
    doc.fillColor(COLOR.label).font("Helvetica-Bold").fontSize(14).text("We Build Trades", MARGIN + 14, y + 20);
  }
  doc.restore();
  doc.fillColor("#000000");
  return y + HEADER_H + 10;
}

function drawSectionBar(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.save();
  doc.rect(MARGIN, y, CONTENT_W, SECTION_BAR_H).fill(COLOR.sectionBar);
  doc
    .fillColor(COLOR.white)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(title.toUpperCase(), MARGIN, y + 9, { width: CONTENT_W, align: "center" });
  doc.restore();
  doc.fillColor("#000000");
  return y + SECTION_BAR_H + 12;
}

const PAGE_BOTTOM_OFFSET = 28;

function pageBottom(doc: PDFKit.PDFDocument): number {
  return doc.page.height - MARGIN - PAGE_BOTTOM_OFFSET;
}

function startNewPdfPage(doc: PDFKit.PDFDocument): number {
  doc.addPage();
  doc.rect(0, 0, PAGE_W, doc.page.height).fill(COLOR.page);
  return MARGIN;
}

function drawFieldGrid(
  doc: PDFKit.PDFDocument,
  fields: PdfField[],
  startY: number,
  defaultCols: 1 | 2 = 2,
): number {
  let y = startY;
  let i = 0;
  const bottom = pageBottom(doc);

  while (i < fields.length) {
    let cols: 1 | 2 = defaultCols;
    const field = fields[i]!;
    if (field.colSpan === 2) cols = 1;

    const span = field.colSpan === 2 ? cols : 1;
    const colW = (CONTENT_W - GAP * (cols - 1)) / cols;
    const rowFields: PdfField[] = [];

    if (span >= cols) {
      rowFields.push(field);
      i += 1;
    } else {
      for (let c = 0; c < cols && i < fields.length; c++) {
        const f = fields[i]!;
        if (f.colSpan === 2) break;
        rowFields.push(f);
        i += 1;
      }
    }

    let maxH = 0;
    const widths: number[] = [];
    if (rowFields.length === 1 && rowFields[0]!.colSpan !== 1) {
      const w = CONTENT_W;
      widths.push(w);
      maxH = cardHeight(doc, rowFields[0]!.label, rowFields[0]!.value, w);
    } else {
      const w = (CONTENT_W - GAP * (rowFields.length - 1)) / rowFields.length;
      for (const rf of rowFields) {
        widths.push(w);
        maxH = Math.max(maxH, cardHeight(doc, rf.label, rf.value, w));
      }
    }

    if (y + maxH > bottom) {
      y = startNewPdfPage(doc);
    }

    let x = MARGIN;
    for (let j = 0; j < rowFields.length; j++) {
      const rf = rowFields[j]!;
      const w = widths[j] ?? colW;
      drawCell(doc, x, y, w, maxH, rf.label, rf.value, rf.icon ?? iconForLabel(rf.label));
      x += w + GAP;
    }
    y += maxH + GAP;
  }

  return y;
}

/** Styled multi-section PDF (WBT header, teal section bars, bordered label/value grid). */
export async function buildOnboardingAnswersPdfBuffer(answers: Answers): Promise<Buffer> {
  const contentSections = ONBOARDING_SCHEMA.sections.filter((s) => s.kind === "questions" && s.questions.length > 0);
  const logo = await loadWbtLogoBuffer();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    doc.rect(0, 0, PAGE_W, doc.page.height).fill(COLOR.page);
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const SECTION_GAP = 14;
    const bottom = pageBottom(doc);
    let y = drawPageHeader(doc, logo, MARGIN);
    let sectionOnPage = false;

    const ensureSpace = (needed: number) => {
      if (y + needed <= bottom) return;
      y = startNewPdfPage(doc);
    };

    for (const section of contentSections) {
      const fields = collectSectionFields(section, answers);
      if (!fields.length) continue;

      if (sectionOnPage) {
        ensureSpace(SECTION_GAP + SECTION_BAR_H + 52);
        y += SECTION_GAP;
      }
      sectionOnPage = true;

      const heading = section.heading ?? section.title;
      ensureSpace(SECTION_BAR_H + 52);
      y = drawSectionBar(doc, heading, y);
      y = drawFieldGrid(doc, fields, y, 2);
    }

    if (!sectionOnPage) {
      y = drawSectionBar(doc, "Onboarding", y);
      doc.font("Helvetica").fontSize(10).fillColor(COLOR.value).text("No answers recorded.", MARGIN, y);
      doc.fillColor("#000000");
    }

    stampPageFooters(doc);
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
