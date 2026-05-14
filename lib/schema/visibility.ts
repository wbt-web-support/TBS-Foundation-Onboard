import type { Answers, AnswerValue, FieldGroupAnswer } from "../types";
import { isNonEmpty, resolveAnswer } from "../answers";
import { ONBOARDING_SCHEMA } from "./questions";
import type { Condition, Question, Section, SubQuestion, VisibilityRule } from "./types";

function asArray(value: AnswerValue | undefined): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function evalCondition(cond: Condition, answers: Answers, localScope?: FieldGroupAnswer): boolean {
  const value = resolveAnswer(answers, cond.questionId, localScope);
  let ok = true;

  if (cond.isAnswered !== undefined) {
    ok = ok && isNonEmpty(value) === cond.isAnswered;
  }
  if (cond.equals !== undefined) {
    ok = ok && value === cond.equals;
  }
  if (cond.oneOf !== undefined) {
    ok = ok && cond.oneOf.includes(value as string | number | boolean);
  }
  if (cond.includes !== undefined) {
    ok = ok && asArray(value).includes(cond.includes);
  }
  if (cond.includesAny !== undefined) {
    const arr = asArray(value);
    ok = ok && cond.includesAny.some((v) => arr.includes(v));
  }
  if (cond.includesAll !== undefined) {
    const arr = asArray(value);
    ok = ok && cond.includesAll.every((v) => arr.includes(v));
  }
  if (cond.minIncludesFrom !== undefined) {
    const arr = asArray(value);
    const hits = cond.minIncludesFrom.values.filter((v) => arr.includes(v)).length;
    ok = ok && hits >= cond.minIncludesFrom.count;
  }

  return cond.not ? !ok : ok;
}

export function isVisible(
  rule: VisibilityRule | undefined,
  answers: Answers,
  localScope?: FieldGroupAnswer,
): boolean {
  if (!rule) return true;
  const allOk = !rule.all || rule.all.every((c) => evalCondition(c, answers, localScope));
  const anyOk = !rule.any || rule.any.length === 0 || rule.any.some((c) => evalCondition(c, answers, localScope));
  const anyOfOk =
    !rule.anyOf ||
    rule.anyOf.length === 0 ||
    rule.anyOf.some((sub) => isVisible(sub, answers, localScope));
  return allOk && anyOk && anyOfOk;
}

export function isQuestionVisible(question: Question, answers: Answers): boolean {
  return isVisible(question.visibleIf, answers);
}

export function isSubQuestionVisible(
  sub: SubQuestion,
  answers: Answers,
  cardScope: FieldGroupAnswer,
): boolean {
  return isVisible(sub.visibleIf, answers, cardScope);
}

export function getVisibleQuestions(section: Section, answers: Answers): Question[] {
  return section.questions.filter((q) => isQuestionVisible(q, answers));
}

const INLINE_OTHER_TEXT_IDS = (): Set<string> => {
  const s = new Set<string>();
  for (const sec of ONBOARDING_SCHEMA.sections) {
    for (const q of sec.questions) {
      if (q.type === "single-choice" && q.otherTextAnswerId) s.add(q.otherTextAnswerId);
    }
  }
  return s;
};

/** Visible questions whose UI is not merged into a parent `single-choice` (e.g. “Other” text). */
export function getVisibleStandaloneQuestions(section: Section, answers: Answers): Question[] {
  const skip = INLINE_OTHER_TEXT_IDS();
  return getVisibleQuestions(section, answers).filter((q) => !skip.has(q.id));
}

export function getVisibleSubQuestions(
  question: Question,
  answers: Answers,
  cardScope: FieldGroupAnswer,
): SubQuestion[] {
  return (question.group ?? []).filter((s) => isSubQuestionVisible(s, answers, cardScope));
}
