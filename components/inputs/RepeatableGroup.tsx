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
  const removeItem = (index: number) => {
    if (items.length <= floor) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const subs = (question.group ?? []).filter((s) => isSubQuestionVisible(s, answers, item ?? {}));
        return (
          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label} {index + 1}
              </span>
              {items.length > floor ? (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {subs.map((s) => (
                <div key={s.id} className={s.width === "half" ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                  <SubFieldInput
                    sub={s}
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
      {items.length < maxItems ? (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
        >
          <Icon name="sparkles" className="size-4" />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}
