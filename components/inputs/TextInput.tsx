"use client";

import { Icon } from "@/components/ui/Icon";
import { FIELD_CLASS, INPUT_PREFIX_FIELD, INPUT_PREFIX_LEAD, INPUT_PREFIX_WRAP } from "./fieldStyles";

type Kind = "text" | "url" | "email" | "tel" | "number" | "password";

const HTML_TYPE: Record<Kind, string> = {
  text: "text",
  url: "url",
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
  leadingIcon,
}: {
  id?: string;
  kind?: Kind;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Icon key into `Icon` (e.g. `mail` for email fields). */
  leadingIcon?: string;
}) {
  if (leadingIcon) {
    return (
      <div className={INPUT_PREFIX_WRAP}>
        <span className={INPUT_PREFIX_LEAD}>
          <Icon name={leadingIcon} className="size-[18px] shrink-0" />
        </span>
        <input
          id={id}
          type={HTML_TYPE[kind]}
          inputMode={kind === "number" ? "numeric" : kind === "tel" ? "tel" : kind === "url" ? "url" : undefined}
          autoComplete={
            kind === "email" ? "email" : kind === "tel" ? "tel" : kind === "url" ? "url" : "off"
          }
          className={INPUT_PREFIX_FIELD}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      </div>
    );
  }

  return (
    <input
      id={id}
      type={HTML_TYPE[kind]}
      inputMode={kind === "number" ? "numeric" : kind === "tel" ? "tel" : kind === "url" ? "url" : undefined}
      autoComplete={
        kind === "email" ? "email" : kind === "tel" ? "tel" : kind === "url" ? "url" : "off"
      }
      className={FIELD_CLASS}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  );
}
