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
    <div className="mt-8 flex items-center justify-between">
      <Button variant="secondary" onClick={goBack} disabled={isFirst}>
        <Icon name="chevron-left" className="size-4" />
        Back
      </Button>
      <Button variant="primary" onClick={goNext}>
        {isLast ? "Submit" : "Next"}
        <Icon name="chevron-right" className="size-4" />
      </Button>
    </div>
  );
}
