import type { AnswerValue, Answers, FieldGroupAnswer, RepeatableAnswer } from "../types";
import {
  isFieldGroupKickoffDeferred,
  isNonEmpty,
  isProvideLaterSentinel,
  isValidEmail,
} from "../answers";
import { ONBOARDING_SCHEMA } from "./questions";
import { TEMPLATE_UPLOAD_OWN_ID } from "./templateGalleries";
import type { Question, Section, SubQuestion } from "./types";
import { getVisibleStandaloneQuestions, isSubQuestionVisible, isVisible } from "./visibility";

/** Does this question contribute a "must answer" slot in its section? */
export function isQuestionRequired(question: Question): boolean {
  return isRequired(question);
}

/**
 * A question is required unless explicitly marked `required: false`.
 * Optional questions never block Next. Required questions can be skipped
 * only via an explicit “I will provide later” (`provideLater`).
 */
function isRequired(question: Question): boolean {
  return question.required !== false;
}

function isSubAnswerSatisfied(sub: SubQuestion, value: unknown, _parentQuestionId?: string): boolean {
  if (sub.type === "url") {
    const s = typeof value === "string" ? value.trim() : "";
    return s ? true : !sub.required;
  }
  if (sub.type === "email") {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s) return !sub.required;
    return isValidEmail(value);
  }
  return isNonEmpty(value as AnswerValue);
}

function isScalarAnswerSatisfied(question: Question, value: unknown): boolean {
  if (question.type === "url") {
    const s = typeof value === "string" ? value.trim() : "";
    return !!s;
  }
  if (question.type === "email") {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s) return false;
    return isValidEmail(value);
  }
  return isNonEmpty(value as AnswerValue);
}

/** Always false — URL fields accept any text, no format validation. */
export function hasInvalidUrlAnswer(_question: Question, _answers: Answers): boolean {
  return false;
}

/** Not used — URL validation is disabled. */
export function invalidUrlMessageForQuestion(_question: Question): string {
  return "";
}

function fieldGroupComplete(question: Question, value: unknown, answers: Answers): boolean {
  if (value == null) return false;
  const scope = (value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}) as FieldGroupAnswer;
  if (isFieldGroupKickoffDeferred(scope)) return true;

  const visibleSubs = (question.group ?? []).filter((s) => isSubQuestionVisible(s, answers, scope));
  if (visibleSubs.length === 0) return true;

  const minFilled = question.fieldGroupMinFilled;
  if (typeof minFilled === "number" && minFilled > 0) {
    const filled = visibleSubs.filter((s) => isSubAnswerSatisfied(s, scope[s.id], question.id)).length;
    return filled >= minFilled;
  }

  if (question.provideLater) {
    const requiredSubs = visibleSubs.filter((s) => s.required);
    return (
      requiredSubs.length === 0 ||
      requiredSubs.every((s) => isSubAnswerSatisfied(s, scope[s.id], question.id))
    );
  }

  return visibleSubs.every((s) => isSubAnswerSatisfied(s, scope[s.id], question.id));
}

function repeatableComplete(question: Question, value: unknown, answers: Answers): boolean {
  const items = (Array.isArray(value) ? value : []) as RepeatableAnswer;
  const minItems = Math.max(question.minItems ?? 1, 1);
  if (items.length < minItems) return false;
  return items.every((item) =>
    (question.group ?? [])
      .filter((s) => isSubQuestionVisible(s, answers, item ?? {}))
      .filter((s) => s.required)
      .every((s) => isSubAnswerSatisfied(s, item?.[s.id])),
  );
}

/** Is this (visible) question satisfied? Optional questions are always "complete". */
export function isQuestionComplete(question: Question, answers: Answers): boolean {
  const value = answers[question.id];
  if (isProvideLaterSentinel(value)) return true;
  if (question.type === "field-group") {
    return isRequired(question) ? fieldGroupComplete(question, value, answers) : true;
  }
  if (question.type === "repeatable-group") {
    return isRequired(question) ? repeatableComplete(question, value, answers) : true;
  }
  if (question.type === "single-choice" && isRequired(question)) {
    if (!isNonEmpty(value)) return false;
    if (question.otherTextAnswerId) {
      const when = question.otherTextWhen ?? "other";
      if (value === when) {
        return isNonEmpty(answers[question.otherTextAnswerId]);
      }
    }
    return true;
  }
  if (
    question.type === "image-gallery-pick" &&
    isRequired(question) &&
    value === TEMPLATE_UPLOAD_OWN_ID &&
    question.galleryUploadCompanionKey
  ) {
    return isNonEmpty(answers[question.galleryUploadCompanionKey]);
  }
  if (!isRequired(question)) return true;
  return isScalarAnswerSatisfied(question, value);
}

/** For the per-card "Completed" badge: required cards use full validation; optional cards just check for any value. */
export function questionDisplayComplete(question: Question, answers: Answers): boolean {
  if (isRequired(question)) return isQuestionComplete(question, answers);
  const value = answers[question.id];
  if (question.type === "url") {
    const s = typeof value === "string" ? value.trim() : "";
    return !!s;
  }
  if (question.type === "email") {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s) return false;
    return isValidEmail(value);
  }
  return isNonEmpty(value);
}

/** Visible standalone questions completed vs total (matches per-card "Completed" in the UI). */
export function sectionVisibleQuestionCompletion(section: Section, answers: Answers): {
  completed: number;
  total: number;
} {
  const visible = getVisibleStandaloneQuestions(section, answers);
  const completed = visible.filter((q) => questionDisplayComplete(q, answers)).length;
  return { completed, total: visible.length };
}

export interface SectionProgress {
  total: number;
  completed: number;
  /** All visible required questions answered (true for question-free sections). */
  complete: boolean;
  percent: number; // 0-100
}

export interface SectionProgressContext {
  sectionIndex: number;
  currentSectionIndex: number;
}

export function sectionProgress(
  section: Section,
  answers: Answers,
  _ctx?: SectionProgressContext,
): SectionProgress {
  const visibleRequired = getVisibleStandaloneQuestions(section, answers).filter(isRequired);
  const total = visibleRequired.length;
  const completed = visibleRequired.filter((q) => isQuestionComplete(q, answers)).length;
  const complete = completed === total;
  const percent = total === 0 ? 100 : Math.round((completed / total) * 100);
  return { total, completed, complete, percent };
}

/** Visible, required, and not-yet-satisfied questions in a section (for Next validation). */
export function sectionMissingRequired(section: Section, answers: Answers): Question[] {
  return getVisibleStandaloneQuestions(section, answers)
    .filter(isRequired)
    .filter((q) => !isQuestionComplete(q, answers));
}

/** First section before `targetIndex` that still has required answers missing. */
export function firstIncompleteSectionBefore(
  targetIndex: number,
  answers: Answers,
  currentSectionIndex: number,
): { sectionIndex: number; section: Section; missing: Question[] } | null {
  const target = Math.max(0, Math.min(targetIndex, ONBOARDING_SCHEMA.sections.length));
  for (let i = 0; i < target; i++) {
    const section = ONBOARDING_SCHEMA.sections[i];
    const missing = sectionMissingRequired(section, answers);
    if (missing.length > 0) {
      return { sectionIndex: i, section, missing };
    }
  }
  return null;
}

export function overallProgress(answers: Answers, currentSectionIndex = 0): number {
  let total = 0;
  let completed = 0;
  for (let i = 0; i < ONBOARDING_SCHEMA.sections.length; i++) {
    const section = ONBOARDING_SCHEMA.sections[i];
    const p = sectionProgress(section, answers, { sectionIndex: i, currentSectionIndex });
    total += p.total;
    completed += p.completed;
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function overallProgressCounts(answers: Answers): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  for (let i = 0; i < ONBOARDING_SCHEMA.sections.length; i++) {
    const section = ONBOARDING_SCHEMA.sections[i];
    const p = sectionProgress(section, answers);
    total += p.total;
    completed += p.completed;
  }
  return { total, completed };
}

/** Re-export for convenience. */
export { isVisible };
