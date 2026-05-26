import {
  FIELD_GROUP_KICKOFF_DEFER_KEY,
  PROVIDE_LATER_SENTINEL,
} from "@/lib/answers";
import type { Answers, AnswerValue } from "@/lib/types";
import type { Question, Section } from "@/lib/schema/types";
import { isQuestionComplete } from "@/lib/schema/progress";
import { getVisibleStandaloneQuestions } from "@/lib/schema/visibility";

/** Value stored when the user chooses “I will provide later” for this question. */
export function provideLaterAnswerValue(question: Question): AnswerValue {
  if (question.type === "field-group") {
    if (question.provideLater?.deferFieldGroupToKickoff) {
      return { [FIELD_GROUP_KICKOFF_DEFER_KEY]: "yes" };
    }
    return {};
  }
  if (question.type === "repeatable-group" || question.type === "multi-choice") {
    return PROVIDE_LATER_SENTINEL;
  }
  return PROVIDE_LATER_SENTINEL;
}

/** First visible question in the section that supports provide-later and is not yet satisfied. */
export function firstProvideLaterTarget(section: Section, answers: Answers): Question | undefined {
  return getVisibleStandaloneQuestions(section, answers).find(
    (q) => q.provideLater && !isQuestionComplete(q, answers),
  );
}
