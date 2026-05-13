"use client";

import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { getVisibleQuestions } from "@/lib/schema/visibility";
import { isQuestionRequired, questionDisplayComplete } from "@/lib/schema/progress";
import { useOnboarding } from "./OnboardingContext";
import { QuestionCard } from "./QuestionCard";
import { QuestionRenderer } from "./QuestionRenderer";
import { IntroScreen } from "./IntroScreen";
import { Footer } from "./Footer";

export function SectionView() {
  const { answers, currentSectionIndex, validationErrors } = useOnboarding();
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];

  if (section.kind === "intro") {
    return (
      <>
        <IntroScreen heading={section.title} body={section.introBody ?? ""} />
        <Footer />
      </>
    );
  }

  const visible = getVisibleQuestions(section, answers);
  return (
    <>
      {section.heading ? <h2 className="text-xl font-semibold text-ink">{section.heading}</h2> : null}
      {section.introBody ? <p className="mt-1.5 text-sm text-muted">{section.introBody}</p> : null}
      <div className={`${section.heading || section.introBody ? "mt-6" : ""} space-y-5`}>
        {visible.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            required={isQuestionRequired(q)}
            complete={questionDisplayComplete(q, answers)}
            invalid={validationErrors.has(q.id)}
          >
            <QuestionRenderer question={q} />
          </QuestionCard>
        ))}
      </div>
      <Footer />
    </>
  );
}
