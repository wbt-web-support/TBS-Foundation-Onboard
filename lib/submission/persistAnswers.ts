import type { AnswerValue, Answers } from "@/lib/types";

import { FOUNDATION_APP_ANSWERS_KEY } from "./foundationAppAnswersKey";
import { buildLegacyQuestionnaire, LEGACY_EXPORT_KEYS } from "./legacyQuestionnaire";

/** Stored JSON: legacy questionnaire keys + app state for hydration. */
export function mergeAnswersForDatabase(appAnswers: Answers): Record<string, unknown> {
  const legacy = buildLegacyQuestionnaire(appAnswers);
  return {
    ...legacy,
    [FOUNDATION_APP_ANSWERS_KEY]: appAnswers,
  };
}

/** Recover the in-app `Answers` map from a DB row (supports pre-legacy rows). */
export function extractAppAnswersFromDatabase(stored: unknown): Answers {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  const o = stored as Record<string, unknown>;
  const inner = o[FOUNDATION_APP_ANSWERS_KEY];
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Answers;
  }
  const out: Answers = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === FOUNDATION_APP_ANSWERS_KEY) continue;
    if (LEGACY_EXPORT_KEYS.has(k)) continue;
    out[k] = v as AnswerValue;
  }
  return out;
}
