"use client";

import type { SubQuestion } from "@/lib/schema/types";
import type { AnswerPrimitive, FieldGroupAnswer } from "@/lib/types";
import { resolveSubFieldPresentation } from "@/lib/schema/siblingPresentation";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { SelectInput } from "./SelectInput";
import { SingleChoice } from "./SingleChoice";
import { YearSelect } from "./YearSelect";
import { FIELD_CLASS, LABEL_CLASS } from "./fieldStyles";

const PREFIX_WRAP =
  "flex w-full overflow-hidden rounded-lg border border-slate-300 bg-white transition outline-none focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25";
const PREFIX_CELL =
  "flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500";
const PREFIX_INPUT =
  "min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-ink outline-none ring-0 placeholder:text-slate-400";

export function SubFieldInput({
  sub,
  value,
  onChange,
  onBlur,
  groupAnswer,
}: {
  sub: SubQuestion;
  value: AnswerPrimitive;
  onChange: (value: AnswerPrimitive) => void;
  onBlur?: () => void;
  /** Field-group row answers; used for `labelBySibling`. */
  groupAnswer?: FieldGroupAnswer;
}) {
  const scope = groupAnswer ?? {};
  const { title, placeholder } = resolveSubFieldPresentation(sub, scope);
  const str = value == null ? "" : String(value);
  const setStr = (v: string) => onChange(v === "" ? null : v);

  let control: React.ReactNode;
  switch (sub.type) {
    case "text":
    case "email":
    case "tel":
    case "number":
    case "password": {
      const ph = placeholder ?? sub.placeholder;
      const htmlType =
        sub.type === "number"
          ? "text"
          : sub.type === "password"
            ? "password"
            : sub.type === "email"
              ? "email"
              : sub.type === "tel"
                ? "tel"
                : "text";
      if (sub.inputPrefix) {
        control = (
          <div className={PREFIX_WRAP}>
            <span className={PREFIX_CELL}>{sub.inputPrefix}</span>
            <input
              type={htmlType}
              inputMode={sub.type === "number" ? "numeric" : sub.type === "tel" ? "tel" : undefined}
              autoComplete={sub.type === "email" ? "email" : sub.type === "tel" ? "tel" : "off"}
              className={PREFIX_INPUT}
              value={str}
              placeholder={ph}
              onChange={(e) => setStr(e.target.value)}
              onBlur={onBlur}
            />
          </div>
        );
      } else {
        control = (
          <TextInput kind={sub.type} value={str} onChange={setStr} onBlur={onBlur} placeholder={ph} />
        );
      }
      break;
    }
    case "textarea":
      control = (
        <TextareaInput value={str} onChange={setStr} onBlur={onBlur} placeholder={placeholder ?? sub.placeholder} rows={3} />
      );
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
        {title}
        {sub.required ? <span className="text-brand-600"> *</span> : null}
      </label>
      {sub.helper ? <p className="mb-1.5 -mt-0.5 text-xs text-muted">{sub.helper}</p> : null}
      {control}
    </div>
  );
}
