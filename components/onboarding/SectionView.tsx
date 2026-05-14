"use client";

import { useState } from "react";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { getVisibleStandaloneQuestions } from "@/lib/schema/visibility";
import { isQuestionRequired, questionDisplayComplete } from "@/lib/schema/progress";
import { useOnboarding } from "./OnboardingContext";
import { QuestionCard } from "./QuestionCard";
import { QuestionRenderer } from "./QuestionRenderer";
import { IntroScreen } from "./IntroScreen";
import { Footer } from "./Footer";
import { TransitionIntroScreen } from "./TransitionIntroScreen";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function SectionView() {
  const { answers, currentSectionIndex, validationErrors, goBack } = useOnboarding();
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];
  const [dismissedTransitionIds, setDismissedTransitionIds] = useState<Set<string>>(new Set());

  if (section.kind === "intro") {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="-mx-5 flex min-h-0 flex-1 flex-col justify-center bg-slate-50 px-5 py-10 sm:-mx-8 sm:px-8 sm:py-12">
          <IntroScreen heading={section.heading ?? section.title} body={section.introBody ?? ""} />
          <Footer />
        </div>
      </div>
    );
  }

  if (section.transitionIntro && !dismissedTransitionIds.has(section.id)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="-mx-5 flex min-h-0 flex-1 flex-col justify-center bg-slate-50 px-5 py-10 sm:-mx-8 sm:px-8 sm:py-12">
          <div className="mx-auto w-full max-w-3xl">
            <TransitionIntroScreen
              title={section.transitionIntro.title}
              description={section.transitionIntro.description}
              checklist={section.transitionIntro.checklist}
              imageSrc={section.transitionIntro.imageSrc}
              imageAlt={section.transitionIntro.imageAlt}
            />
            <div className="mt-8 flex flex-col-reverse items-center gap-4 sm:flex-col">
              <Button variant="secondary" onClick={goBack}>
                <Icon name="chevron-left" className="size-4" />
                Back
              </Button>
              <Button
                variant="introCta"
                className="w-full"
                onClick={() =>
                  setDismissedTransitionIds((prev) => {
                    const next = new Set(prev);
                    next.add(section.id);
                    return next;
                  })
                }
              >
                {(section.transitionIntro.nextLabel ?? "NEXT").toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visible = getVisibleStandaloneQuestions(section, answers);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
    </div>
  );
}
