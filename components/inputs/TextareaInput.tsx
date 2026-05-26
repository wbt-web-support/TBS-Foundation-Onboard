"use client";

import { FIELD_CLASS } from "./fieldStyles";

export function TextareaInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 4,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      className={`${FIELD_CLASS} resize-y`}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  );
}
