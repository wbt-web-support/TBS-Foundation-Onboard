"use client";

import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { overallProgress, overallProgressCounts, sectionProgress } from "@/lib/schema/progress";
import { Icon } from "@/components/ui/Icon";
import { useOnboarding } from "./OnboardingContext";
import { SidebarSectionItem } from "./SidebarSectionItem";
import { ProgressBar } from "./ProgressBar";
import type { SaveStatus } from "./OnboardingContext";

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "Changes save automatically",
  saving: "Saving…",
  saved: "All changes saved",
  error: "Couldn't save, will retry",
};

function SaveDot({ status }: { status: SaveStatus }) {
  const color =
    status === "saved"
      ? "bg-green"
      : status === "saving"
        ? "bg-yellow"
        : status === "error"
          ? "bg-red"
          : "bg-rail-line";
  return <span className={`size-2 shrink-0 rounded-full ${color}`} />;
}

export function Sidebar({ onBackToWelcome }: { onBackToWelcome?: () => void }) {
  const {
    answers,
    currentSectionIndex,
    goToSection,
    email,
    saveStatus,
    signOut,
    completed,
  } = useOnboarding();
  const overall = overallProgress(answers, currentSectionIndex);
  const counts = overallProgressCounts(answers);
  const remaining = counts.total - counts.completed;

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[280px] shrink-0 flex-col bg-rail md:flex">
      {onBackToWelcome && (
        <button
          type="button"
          onClick={onBackToWelcome}
          className="flex w-full items-center gap-1.5 border-b border-rail-line px-5 py-3 text-sm font-medium text-rail-muted transition hover:text-rail-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to overview
        </button>
      )}

      <div className="border-b border-rail-line px-5 py-5">
        <h2 className="font-display text-sm font-semibold text-rail-text">Setup Progress</h2>
        <p className="mt-0.5 text-xs text-rail-muted">Complete all sections to continue</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {ONBOARDING_SCHEMA.sections.map((s, i) => {
          const p = sectionProgress(s, answers, { sectionIndex: i, currentSectionIndex });
          const state =
            i === currentSectionIndex ? "active" : completed || p.complete ? "complete" : "todo";
          return (
            <SidebarSectionItem
              key={s.id}
              number={s.number}
              title={s.title}
              subtitle={s.subtitle}
              state={state}
              onClick={() => goToSection(i)}
            />
          );
        })}
      </nav>

      <div className="border-t border-rail-line px-5 py-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-rail-muted">Overall Progress</span>
          <span className="font-semibold text-orange-2">{overall}%</span>
        </div>
        <ProgressBar percent={overall} />
        {!completed && remaining === 0 && (
          <p className="mt-1.5 text-[11px] font-medium text-green">All questions answered!</p>
        )}
      </div>

      <div className="border-t border-rail-line px-5 py-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-rail-muted" title={email ?? undefined}>
            {email ?? "Not signed in"}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-rail-muted transition hover:text-rail-text"
          >
            <Icon name="logout" className="size-3.5" />
            Sign out
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-rail-muted">
          <SaveDot status={saveStatus} />
          <span>{SAVE_LABEL[saveStatus]}</span>
        </div>
      </div>
    </aside>
  );
}
