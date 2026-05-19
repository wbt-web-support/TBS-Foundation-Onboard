import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import {
  isQuestionRequired,
  questionDisplayComplete,
  sectionMissingRequired,
} from "@/lib/schema/progress";
import { getVisibleStandaloneQuestions } from "@/lib/schema/visibility";
import type { Question } from "@/lib/schema/types";
import type { Answers } from "@/lib/types";

export type ClientFormProgress = {
  totalQuestions: number;
  filledQuestions: number;
  percentComplete: number;
  currentQuestionTitle: string | null;
  currentSectionName: string | null;
};

function questionTitle(q: Question): string {
  if (q.titleRich?.length) return q.titleRich.map((s) => s.text).join("");
  return q.title;
}

/** Count visible required questions and how many are answered. */
export function computeClientFormProgress(
  answers: Answers,
  currentSectionIndex: number,
  completed: boolean,
): ClientFormProgress {
  let totalQuestions = 0;
  let filledQuestions = 0;

  for (const section of ONBOARDING_SCHEMA.sections) {
    const visible = getVisibleStandaloneQuestions(section, answers).filter(isQuestionRequired);
    totalQuestions += visible.length;
    filledQuestions += visible.filter((q) => questionDisplayComplete(q, answers)).length;
  }

  const percentComplete = completed
    ? 100
    : totalQuestions === 0
      ? 0
      : Math.round((filledQuestions / totalQuestions) * 100);

  let currentQuestionTitle: string | null = null;
  let currentSectionName: string | null = null;

  if (!completed) {
    const idx = Math.max(0, Math.min(currentSectionIndex, ONBOARDING_SCHEMA.sections.length - 1));
    const activeSection = ONBOARDING_SCHEMA.sections[idx];
    const missing = sectionMissingRequired(activeSection, answers);
    if (missing.length > 0) {
      currentSectionName = activeSection.heading ?? activeSection.id;
      currentQuestionTitle = questionTitle(missing[0]);
    } else {
      for (let i = idx; i < ONBOARDING_SCHEMA.sections.length; i++) {
        const section = ONBOARDING_SCHEMA.sections[i];
        const miss = sectionMissingRequired(section, answers);
        if (miss.length > 0) {
          currentSectionName = section.heading ?? section.id;
          currentQuestionTitle = questionTitle(miss[0]);
          break;
        }
      }
    }

    if (!currentQuestionTitle) {
      for (const section of ONBOARDING_SCHEMA.sections) {
        const visible = getVisibleStandaloneQuestions(section, answers).filter(isQuestionRequired);
        const stuck = visible.find((q) => !questionDisplayComplete(q, answers));
        if (stuck) {
          currentSectionName = section.heading ?? section.id;
          currentQuestionTitle = questionTitle(stuck);
          break;
        }
      }
    }
  }

  return {
    totalQuestions,
    filledQuestions,
    percentComplete,
    currentQuestionTitle,
    currentSectionName,
  };
}
