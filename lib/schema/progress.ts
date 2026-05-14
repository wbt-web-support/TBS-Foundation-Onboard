import type { Answers, FieldGroupAnswer, RepeatableAnswer } from "../types";
import { isFieldGroupKickoffDeferred, isNonEmpty } from "../answers";
import { ONBOARDING_SCHEMA } from "./questions";
import type { Question, Section } from "./types";
import { getVisibleStandaloneQuestions, isSubQuestionVisible, isVisible } from "./visibility";

/** Does this question contribute a "must answer" slot in its section? */
export function isQuestionRequired(question: Question): boolean {
  return isRequired(question);
}

function isRequired(question: Question): boolean {
  if (question.type === "repeatable-group") {
    return Boolean(question.required) || (question.minItems ?? 0) >= 1;
  }
  if (question.type === "field-group") {
    return (question.group ?? []).some((s) => s.required);
  }
  return Boolean(question.required);
}

function fieldGroupComplete(question: Question, value: unknown, answers: Answers): boolean {
  const scope = (value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}) as FieldGroupAnswer;
  if (isFieldGroupKickoffDeferred(scope)) return true;
  return (question.group ?? [])
    .filter((s) => isSubQuestionVisible(s, answers, scope))
    .filter((s) => s.required)
    .every((s) => isNonEmpty(scope[s.id]));
}

function repeatableComplete(question: Question, value: unknown, answers: Answers): boolean {
  const items = (Array.isArray(value) ? value : []) as RepeatableAnswer;
  const minItems = Math.max(question.minItems ?? (question.required ? 1 : 0), isRequired(question) ? 1 : 0);
  if (items.length < minItems) return false;
  return items.every((item) =>
    (question.group ?? [])
      .filter((s) => isSubQuestionVisible(s, answers, item ?? {}))
      .filter((s) => s.required)
      .every((s) => isNonEmpty(item?.[s.id])),
  );
}

/** Is this (visible) question satisfied? Optional questions are always "complete". */
export function isQuestionComplete(question: Question, answers: Answers): boolean {
  const value = answers[question.id];
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
  if (!isRequired(question)) return true;
  return isNonEmpty(value);
}

/** For the per-card "Completed" badge: required cards use full validation; optional cards just check for any value. */
export function questionDisplayComplete(question: Question, answers: Answers): boolean {
  if (isRequired(question)) return isQuestionComplete(question, answers);
  return isNonEmpty(answers[question.id]);
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

export function sectionProgress(section: Section, answers: Answers): SectionProgress {
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

export function overallProgress(answers: Answers): number {
  let total = 0;
  let completed = 0;
  for (const section of ONBOARDING_SCHEMA.sections) {
    const p = sectionProgress(section, answers);
    total += p.total;
    completed += p.completed;
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

/** Re-export for convenience. */
export { isVisible };
