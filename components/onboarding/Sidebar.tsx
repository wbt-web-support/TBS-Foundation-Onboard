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
      ? "bg-emerald-500"
      : status === "saving"
        ? "bg-amber-400"
        : status === "error"
          ? "bg-rose-500"
          : "bg-slate-300";
  return <span className={`size-2 shrink-0 rounded-full ${color}`} />;
}

export function Sidebar() {
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
  const estMinutes = Math.ceil(remaining * 0.5);

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[300px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:flex">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-700/80">
        <h1 className="text-base font-semibold text-ink">Setup Progress</h1>
        <p className="mt-0.5 text-xs text-muted">Complete all sections to continue</p>
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

      <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700/80">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-400">Overall Progress</span>
          <span className="font-semibold text-brand-600">{overall}%</span>
        </div>
        <ProgressBar percent={overall} />
        {!completed && remaining > 0 && (
          <p className="mt-1.5 text-[11px] text-slate-400">
           
          </p>
        )}
        {!completed && remaining === 0 && (
          <p className="mt-1.5 text-[11px] text-emerald-600 font-medium">All questions answered!</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700/80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-slate-600 dark:text-slate-400" title={email ?? undefined}>
            {email ?? "Not signed in"}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
          >
            <Icon name="logout" className="size-3.5" />
            Sign out
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <SaveDot status={saveStatus} />
          <span>{SAVE_LABEL[saveStatus]}</span>
        </div>
      </div>
    </aside>
  );
}
