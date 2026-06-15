"use client";

import { Icon } from "@/components/ui/Icon";

export type StepNavState = "active" | "complete" | "todo";

const SHELL: Record<StepNavState, string> = {
  active: "border-orange/30 bg-rail-2",
  complete: "border-green/20 bg-rail-2/60",
  todo: "border-transparent bg-transparent hover:border-rail-line hover:bg-rail-2/40",
};

const BADGE: Record<StepNavState, string> = {
  complete: "bg-green text-white",
  active: "bg-orange text-white",
  todo: "bg-rail-2 text-rail-muted border border-rail-line",
};

const TITLE: Record<StepNavState, string> = {
  active: "text-rail-text",
  complete: "text-rail-text",
  todo: "text-rail-muted",
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
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition ${SHELL[state]} ${className}`}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${BADGE[state]}`}
      >
        {state === "complete" ? <Icon name="check" className="size-4" /> : number}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${TITLE[state]}`}>{title}</span>
        <span className="block text-xs text-rail-muted">{subtitle}</span>
      </span>
    </div>
  );
}
