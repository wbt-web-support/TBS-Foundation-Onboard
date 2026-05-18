"use client";

import { useMemo, useState } from "react";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { getVisibleStandaloneQuestions } from "@/lib/schema/visibility";
import {
  isQuestionRequired,
  questionDisplayComplete,
  sectionVisibleQuestionCompletion,
} from "@/lib/schema/progress";
import { useOnboarding } from "./OnboardingContext";
import { QuestionCard } from "./QuestionCard";
import { QuestionRenderer } from "./QuestionRenderer";
import { IntroScreen } from "./IntroScreen";
import { Footer } from "./Footer";
import { TransitionIntroScreen } from "./TransitionIntroScreen";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionValidationAlert } from "./SectionValidationAlert";

export function SectionView() {
  const { answers, currentSectionIndex, validationErrors, sectionValidationMessage, goBack } =
    useOnboarding();
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];
  const [dismissedTransitionIds, setDismissedTransitionIds] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => getVisibleStandaloneQuestions(section, answers),
    [section, answers],
  );
  const completion = useMemo(
    () => sectionVisibleQuestionCompletion(section, answers),
    [section, answers],
  );

  if (section.kind === "intro") {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="-mx-5 flex min-h-0 flex-1 flex-col justify-center bg-[var(--color-page-bg)] px-5 py-10 sm:-mx-8 sm:px-8 sm:py-12">
          <IntroScreen heading={section.heading ?? section.title} body={section.introBody ?? ""} />
          <Footer />
        </div>
      </div>
    );
  }

  if (section.transitionIntro && !dismissedTransitionIds.has(section.id)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="-mx-5 flex min-h-0 flex-1 flex-col justify-center bg-[var(--color-intro-backdrop)] px-5 py-10 sm:-mx-8 sm:px-8 sm:py-12">
          <div className="mx-auto w-full max-w-3xl">
            <TransitionIntroScreen
              title={section.transitionIntro.title}
              description={section.transitionIntro.description}
              checklist={section.transitionIntro.checklist}
              closingText={section.transitionIntro.closingText}
              imageSrc={section.transitionIntro.imageSrc}
              imageAlt={section.transitionIntro.imageAlt}
            />
            <div className="mt-8 flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={goBack}>
                <Icon name="chevron-left" className="size-4" />
                Back
              </Button>
              <Button
                variant="introCta"
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-14 z-20 -mx-5 mb-6 border-b border-slate-200/90 bg-[var(--color-page-bg)]/95 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8 supports-[backdrop-filter]:bg-[var(--color-page-bg)]/90">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            {section.heading ? <h2 className="text-xl font-semibold text-ink">{section.heading}</h2> : null}
            {section.introBody ? (
              <p className={`text-sm text-muted ${section.heading ? "mt-1.5" : ""}`}>{section.introBody}</p>
            ) : null}
          </div>
          {completion.total > 0 ? (
            <p
              className="shrink-0 text-sm tabular-nums text-muted"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`${completion.completed} of ${completion.total} questions completed in this section`}
            >
              <span className="font-semibold text-ink">{completion.completed}</span>
              <span className="text-muted" aria-hidden="true">
                {" "}
                /{" "}
              </span>
              <span>{completion.total}</span>
            </p>
          ) : null}
        </div>
      </div>
      {sectionValidationMessage ? <SectionValidationAlert message={sectionValidationMessage} /> : null}
      <div className="space-y-5">
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
