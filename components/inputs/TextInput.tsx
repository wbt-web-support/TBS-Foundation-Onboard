"use client";

import { FIELD_CLASS } from "./fieldStyles";

type Kind = "text" | "email" | "tel" | "number" | "password";

const HTML_TYPE: Record<Kind, string> = {
  text: "text",
  email: "email",
  tel: "tel",
  number: "text", // keep as text so partial input isn't rejected; inputMode hints the keyboard
  password: "password",
};

export function TextInput({
  id,
  kind = "text",
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  id?: string;
  kind?: Kind;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type={HTML_TYPE[kind]}
      inputMode={kind === "number" ? "numeric" : kind === "tel" ? "tel" : undefined}
      autoComplete={kind === "email" ? "email" : kind === "tel" ? "tel" : "off"}
      className={FIELD_CLASS}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  );
}
