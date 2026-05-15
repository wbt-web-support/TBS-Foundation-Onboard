"use client";

import { useMemo } from "react";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { firstProvideLaterTarget, provideLaterAnswerValue } from "@/lib/provideLater";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useOnboarding } from "./OnboardingContext";

export function Footer() {
  const { currentSectionIndex, goBack, goNext, answers, setAnswer, flushSave } = useOnboarding();
  const isFirst = currentSectionIndex === 0;
  const isLast = currentSectionIndex === ONBOARDING_SCHEMA.sections.length - 1;
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];

  const provideLaterTarget = useMemo(() => {
    if (section.kind !== "questions") return undefined;
    return firstProvideLaterTarget(section, answers);
  }, [section, answers]);

  const onProvideLater = () => {
    if (!provideLaterTarget) return;
    void (async () => {
      setAnswer(provideLaterTarget.id, provideLaterAnswerValue(provideLaterTarget));
      await flushSave();
      goNext();
    })();
  };

  const provideLaterLabel =
    provideLaterTarget?.provideLater?.label ?? "I will provide later";

  return (
    <div
      className={
        isFirst
          ? "mx-auto mt-8 w-full max-w-4xl"
          : provideLaterTarget
            ? "mt-8 flex flex-wrap items-center justify-center gap-3"
            : "mt-8 flex items-center justify-between"
      }
    >
      {!isFirst ? (
        <Button variant="secondary" onClick={goBack}>
          <Icon name="chevron-left" className="size-4" />
          Back
        </Button>
      ) : null}
      {provideLaterTarget ? (
        <Button variant="introCta" onClick={onProvideLater}>
          {provideLaterLabel}
          <Icon name="chevron-right" className="size-4" />
        </Button>
      ) : null}
      <Button
        variant={isFirst ? "introCta" : "primary"}
        onClick={goNext}
        className={isFirst ? "w-full" : ""}
      >
        {isLast ? "Submit" : isFirst ? "Begin questionnaire" : "Next"}
        {!isLast && !isFirst ? <Icon name="chevron-right" className="size-4" /> : null}
        {isLast ? <Icon name="chevron-right" className="size-4" /> : null}
      </Button>
    </div>
  );
}
