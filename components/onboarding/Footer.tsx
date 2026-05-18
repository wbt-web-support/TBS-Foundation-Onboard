"use client";

import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useOnboarding } from "./OnboardingContext";

export function Footer() {
  const { currentSectionIndex, goBack, goNext } = useOnboarding();
  const isFirst = currentSectionIndex === 0;
  const isLast = currentSectionIndex === ONBOARDING_SCHEMA.sections.length - 1;

  return (
    <div
      className={
        isFirst ? "mx-auto mt-8 w-full max-w-4xl" : "mt-8 flex items-center justify-between gap-3"
      }
    >
      {!isFirst ? (
        <Button variant="secondary" onClick={goBack}>
          <Icon name="chevron-left" className="size-4" />
          Back
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
