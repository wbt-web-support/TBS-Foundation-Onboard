"use client";

import { Icon } from "@/components/ui/Icon";

export type SectionState = "active" | "complete" | "todo";

export function SidebarSectionItem({
  number,
  title,
  subtitle,
  state,
  onClick,
}: {
  number: number;
  title: string;
  subtitle: string;
  state: SectionState;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
        state === "active" ? "bg-brand-50" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
          state === "complete"
            ? "bg-emerald-500 text-white"
            : state === "active"
              ? "bg-brand-500 text-white"
              : "bg-slate-200 text-slate-600"
        }`}
      >
        {state === "complete" ? <Icon name="check" className="size-4" /> : number}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm font-medium ${state === "active" ? "text-brand-700" : "text-slate-800"}`}
        >
          {title}
        </span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
    </button>
  );
}
