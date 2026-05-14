"use client";

import type { Question } from "@/lib/schema/types";
import type { Answers, AnswerPrimitive, FieldGroupAnswer } from "@/lib/types";
import { FIELD_GROUP_KICKOFF_DEFER_KEY } from "@/lib/answers";
import { isSubQuestionVisible } from "@/lib/schema/visibility";
import { SubFieldInput } from "./SubFieldInput";

export function FieldGroupInput({
  question,
  value,
  answers,
  onChange,
  onBlur,
}: {
  question: Question;
  value: FieldGroupAnswer | undefined;
  answers: Answers;
  onChange: (value: FieldGroupAnswer) => void;
  onBlur?: () => void;
}) {
  const current: FieldGroupAnswer = value ?? {};
  const subs = (question.group ?? []).filter((s) => isSubQuestionVisible(s, answers, current));
  const set = (subId: string, v: AnswerPrimitive) => {
    const next: FieldGroupAnswer = { ...current, [subId]: v };
    delete next[FIELD_GROUP_KICKOFF_DEFER_KEY];
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
      {subs.map((s) => (
        <div key={s.id} className={s.width === "half" ? "col-span-2 sm:col-span-1" : "col-span-2"}>
          <SubFieldInput
            sub={s}
            value={current[s.id] ?? null}
            onChange={(v) => set(s.id, v)}
            onBlur={onBlur}
            groupAnswer={current}
          />
        </div>
      ))}
    </div>
  );
}
