"use client";

import { Icon } from "@/components/ui/Icon";

export type StepNavState = "active" | "complete" | "todo";

const SHELL: Record<StepNavState, string> = {
  active: "border-brand-200 bg-brand-50/80",
  complete: "border-slate-200 bg-slate-50",
  todo: "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50",
};

const BADGE: Record<StepNavState, string> = {
  complete: "bg-emerald-500 text-white",
  active: "bg-brand-500 text-white",
  todo: "bg-slate-200 text-slate-600",
};

const TITLE: Record<StepNavState, string> = {
  active: "text-brand-700",
  complete: "text-slate-800",
  todo: "text-slate-800",
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
