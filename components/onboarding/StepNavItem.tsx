"use client";

import { Icon } from "@/components/ui/Icon";

export type StepNavState = "active" | "complete" | "todo";

const SHELL: Record<StepNavState, string> = {
  active: "border-brand-200 bg-brand-50/80 dark:border-brand-800/60 dark:bg-brand-900/30",
  complete: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-900/20",
  todo: "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60",
};

const BADGE: Record<StepNavState, string> = {
  complete: "bg-emerald-500 text-white",
  active: "bg-brand-500 text-white",
  todo: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const TITLE: Record<StepNavState, string> = {
  active: "text-brand-700 dark:text-brand-400",
  complete: "text-emerald-800 dark:text-emerald-400",
  todo: "text-slate-800 dark:text-slate-300",
};

export function StepNavItem({
  number,
  title,
  subtitle,
  state,
  className = "",
}: {
  number: number;
  title: string;
  subtitle: string;
  state: StepNavState;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${SHELL[state]} ${className}`}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${BADGE[state]}`}
      >
        {state === "complete" ? <Icon name="check" className="size-4" /> : number}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${TITLE[state]}`}>{title}</span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
    </div>
  );
}
