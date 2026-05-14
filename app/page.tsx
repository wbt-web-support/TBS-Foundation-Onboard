import { Suspense } from "react";
import OnboardingApp from "@/components/onboarding/OnboardingApp";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <OnboardingApp />
    </Suspense>
  );
}
