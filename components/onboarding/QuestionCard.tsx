"use client";

import type { ReactNode } from "react";
import type { Question } from "@/lib/schema/types";
import { Icon } from "@/components/ui/Icon";

export function QuestionCard({
  question,
  required,
  complete,
  invalid,
  children,
}: {
  question: Question;
  required: boolean;
  complete: boolean;
  invalid: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={`q-${question.id}`}
      className={`scroll-mt-8 rounded-card border bg-white p-6 shadow-sm transition ${
        invalid ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name={question.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-ink">{question.title}</h3>
          {question.helper ? <p className="mt-1 text-sm text-muted">{question.helper}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            required ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>

      <div className="mt-4">{children}</div>

      <div className="mt-4 flex items-center gap-1.5 text-xs">
        <Icon name="check" className={`size-3.5 ${complete ? "text-emerald-600" : "text-slate-300"}`} />
        <span className={complete ? "font-medium text-emerald-600" : "text-slate-400"}>
          {complete ? "Completed" : required ? "Required" : "Optional"}
        </span>
        {invalid ? <span className="ml-2 text-rose-600">This field is required.</span> : null}
      </div>
    </div>
  );
}
