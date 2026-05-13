"use client";

import type { SubQuestion } from "@/lib/schema/types";
import type { AnswerPrimitive } from "@/lib/types";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { SelectInput } from "./SelectInput";
import { SingleChoice } from "./SingleChoice";
import { YearSelect } from "./YearSelect";
import { FIELD_CLASS, LABEL_CLASS } from "./fieldStyles";

export function SubFieldInput({
  sub,
  value,
  onChange,
  onBlur,
}: {
  sub: SubQuestion;
  value: AnswerPrimitive;
  onChange: (value: AnswerPrimitive) => void;
  onBlur?: () => void;
}) {
  const str = value == null ? "" : String(value);
  const setStr = (v: string) => onChange(v === "" ? null : v);

  let control: React.ReactNode;
  switch (sub.type) {
    case "text":
    case "email":
    case "tel":
    case "number":
    case "password":
      control = (
        <TextInput
          kind={sub.type}
          value={str}
          onChange={setStr}
          onBlur={onBlur}
          placeholder={sub.placeholder}
        />
      );
      break;
    case "textarea":
      control = <TextareaInput value={str} onChange={setStr} onBlur={onBlur} placeholder={sub.placeholder} rows={3} />;
      break;
    case "select":
      control = <SelectInput options={sub.options ?? []} value={str} onChange={setStr} onBlur={onBlur} />;
      break;
    case "single-choice":
      control = <SingleChoice options={sub.options ?? []} value={str} onChange={setStr} />;
      break;
    case "year-select":
      control = (
        <YearSelect
          from={sub.yearRange?.from ?? 1999}
          to={sub.yearRange?.to ?? new Date().getFullYear()}
          value={str}
          onChange={setStr}
          onBlur={onBlur}
        />
      );
      break;
    case "time":
      control = (
        <input
          type="time"
          className={FIELD_CLASS}
          value={str}
          onChange={(e) => setStr(e.target.value)}
          onBlur={onBlur}
        />
      );
      break;
  }

  return (
    <div>
      <label className={LABEL_CLASS}>
        {sub.title}
        {sub.required ? <span className="text-brand-600"> *</span> : null}
      </label>
      {sub.helper ? <p className="mb-1.5 -mt-0.5 text-xs text-muted">{sub.helper}</p> : null}
      {control}
    </div>
  );
}
