"use client";

import type { Option } from "@/lib/schema/types";
import { OptionCard } from "./OptionCard";

export function MultiChoice({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const longest = options.reduce((m, o) => Math.max(m, o.label.length), 0);
  const cols = longest > 28 ? 1 : longest > 14 ? 2 : 3;
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <OptionCard
          key={o.value}
          label={o.label}
          control="checkbox"
          selected={value.includes(o.value)}
          onClick={() => toggle(o.value)}
        />
      ))}
    </div>
  );
}
