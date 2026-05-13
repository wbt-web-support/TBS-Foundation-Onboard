"use client";

import { Icon } from "@/components/ui/Icon";

export function OptionCard({
  label,
  selected,
  onClick,
  control,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  control: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition ${
        selected
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
          : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      <span
        className={`grid size-5 shrink-0 place-items-center border ${
          control === "radio" ? "rounded-full" : "rounded"
        } ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-transparent"}`}
      >
        {control === "radio" ? (
          <span className={`size-2 rounded-full ${selected ? "bg-white" : "bg-transparent"}`} />
        ) : (
          <Icon name="check" className="size-3.5" />
        )}
      </span>
      <span className="text-slate-700">{label}</span>
    </button>
  );
}
