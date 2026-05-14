"use client";

import type { SubQuestion } from "@/lib/schema/types";
import type { AnswerPrimitive, FieldGroupAnswer } from "@/lib/types";
import { resolveSubFieldPresentation } from "@/lib/schema/siblingPresentation";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { SelectInput } from "./SelectInput";
import { SingleChoice } from "./SingleChoice";
import { YearSelect } from "./YearSelect";
import { FIELD_CLASS, INPUT_PREFIX_FIELD, INPUT_PREFIX_LEAD, INPUT_PREFIX_WRAP, LABEL_CLASS } from "./fieldStyles";

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
          <div className={INPUT_PREFIX_WRAP}>
            <span className={`${INPUT_PREFIX_LEAD} font-medium`}>{sub.inputPrefix}</span>
            <input
              type={htmlType}
              inputMode={sub.type === "number" ? "numeric" : sub.type === "tel" ? "tel" : undefined}
              autoComplete={sub.type === "email" ? "email" : sub.type === "tel" ? "tel" : "off"}
              className={INPUT_PREFIX_FIELD}
              value={str}
              placeholder={ph}
              onChange={(e) => setStr(e.target.value)}
              onBlur={onBlur}
            />
          </div>
        );
      } else {
        control = (
          <TextInput
            kind={sub.type}
            value={str}
            onChange={setStr}
            onBlur={onBlur}
            placeholder={ph}
            leadingIcon={sub.type === "email" ? "mail" : undefined}
          />
        );
      }
      break;
    }
    case "textarea":
      control = (
        <TextareaInput
          value={str}
          onChange={setStr}
          onBlur={onBlur}
          placeholder={placeholder ?? sub.placeholder}
          rows={sub.rows ?? 3}
        />
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
      <label className={`${LABEL_CLASS} flex items-center gap-2`}>
        {sub.labelIconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sub.labelIconUrl}
            alt=""
            className="size-5 shrink-0 object-contain"
            width={20}
            height={20}
          />
        ) : null}
        <span>
          {title}
          {sub.required ? <span className="text-brand-600"> *</span> : null}
        </span>
      </label>
      {sub.helper ? <p className="mb-1.5 -mt-0.5 text-xs text-muted">{sub.helper}</p> : null}
      {control}
    </div>
  );
}
