import type {
  Answers,
  AnswerValue,
  FieldGroupAnswer,
  TimeRangeAnswer,
} from "./types";

/**
 * Stored when the user chooses “I will provide later” on a required scalar question
 * (so progress treats the card as satisfied without a real value).
 */
export const PROVIDE_LATER_SENTINEL = "__fo_provide_later__";

export function isProvideLaterSentinel(value: unknown): boolean {
  return value === PROVIDE_LATER_SENTINEL;
}

/** Field-group: user defers credentials to kick-off (progress passes without username/password). */
export const FIELD_GROUP_KICKOFF_DEFER_KEY = "__kickoff_meeting__";

export function isFieldGroupKickoffDeferred(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (value as Record<string, unknown>)[FIELD_GROUP_KICKOFF_DEFER_KEY] === "yes";
}
export function isNonEmpty(value: AnswerValue | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") {
    if (isProvideLaterSentinel(value)) return true;
    return value.trim().length > 0;
  }
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    // string[] (multi-choice) or array of field-group answers (repeatable).
    return value.some((item) =>
      typeof item === "string"
        ? item.trim().length > 0
        : item != null && Object.values(item).some((v) => isNonEmpty(v as AnswerValue)),
    );
  }
  // object: field-group answer or time-range
  const obj = value as Record<string, unknown>;
  if ("open" in obj || "close" in obj) {
    const tr = value as TimeRangeAnswer;
    return Boolean(tr.open && tr.close);
  }
  return Object.values(obj).some((v) => isNonEmpty(v as AnswerValue));
}

/** Read an answer by id or dotted path "cardId.subId". `localScope` (a card's sub-answers) wins. */
export function resolveAnswer(
  answers: Answers,
  questionId: string,
  localScope?: FieldGroupAnswer,
): AnswerValue | undefined {
  if (localScope && Object.prototype.hasOwnProperty.call(localScope, questionId)) {
    return localScope[questionId] as AnswerValue;
  }
  if (questionId.includes(".")) {
    const [head, ...rest] = questionId.split(".");
    const container = answers[head];
    if (container && typeof container === "object" && !Array.isArray(container)) {
      return (container as Record<string, AnswerValue>)[rest.join(".")];
    }
    return undefined;
  }
  return answers[questionId];
}

/** Read a dotted-path answer (top-level only — no local scope). */
export function getByPath(answers: Answers, path: string): AnswerValue | undefined {
  return resolveAnswer(answers, path);
}

/** Coerce an answer to a trimmed string (or null). */
export function asStringOrNull(value: AnswerValue | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  return null;
}

/** Coerce an answer to a number (or null) — used for the satisfaction rating. */
export function asNumberOrNull(value: AnswerValue | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
