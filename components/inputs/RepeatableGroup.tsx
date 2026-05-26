"use client";

import type { Question } from "@/lib/schema/types";
import type { Answers, AnswerPrimitive, FieldGroupAnswer, RepeatableAnswer } from "@/lib/types";
import { isSubQuestionVisible } from "@/lib/schema/visibility";
import { SubFieldInput } from "./SubFieldInput";
import { Icon } from "@/components/ui/Icon";

export function RepeatableGroup({
  question,
  value,
  answers,
  onChange,
  onBlur,
}: {
  question: Question;
  value: RepeatableAnswer | undefined;
  answers: Answers;
  onChange: (value: RepeatableAnswer) => void;
  onBlur?: () => void;
}) {
  const stored: RepeatableAnswer = Array.isArray(value) ? value : [];
  const minItems = Math.max(question.minItems ?? 0, 0);
  const maxItems = question.maxItems ?? Infinity;
  // Always render at least `minItems` rows (or 1 if a min is set) for editing.
  const floor = minItems > 0 ? Math.max(minItems, 1) : stored.length;
  const items: RepeatableAnswer =
    stored.length >= floor ? stored : [...stored, ...Array.from({ length: floor - stored.length }, () => ({}))];
  const label = question.groupItemLabel ?? "Item";
  const addLabel = question.repeatableAddButtonLabel ?? `Add ${label.toLowerCase()}`;

  const updateItem = (index: number, next: FieldGroupAnswer) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };
  const setSub = (index: number, subId: string, v: AnswerPrimitive) =>
    updateItem(index, { ...(items[index] ?? {}), [subId]: v });
  const addItem = () => onChange([...items, {}]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          No entries yet. Click &ldquo;{addLabel}&rdquo; below to add one.
        </p>
      )}
      {items.map((item, index) => {
        const subs = (question.group ?? []).filter((s) => isSubQuestionVisible(s, answers, item ?? {}));
        return (
          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label} {index + 1}
              </span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                >
                  <Icon name="x" className="size-3 shrink-0" />
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {subs.map((s) => (
                <div key={s.id} className={s.width === "half" ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                  <SubFieldInput
                    sub={s}
                    fieldScopeId={`${question.id}-${index}-${s.id}`}
                    value={(item ?? {})[s.id] ?? null}
                    onChange={(v) => setSub(index, s.id, v)}
                    onBlur={onBlur}
                    groupAnswer={item ?? {}}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {(items.length === 0 || items.length < maxItems) ? (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
        >
          <Icon name="sparkles" className="size-4" />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}
