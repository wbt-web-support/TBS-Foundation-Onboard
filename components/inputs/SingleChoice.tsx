"use client";

import type { Option } from "@/lib/schema/types";
import { OptionCard } from "./OptionCard";

export function SingleChoice({
  options,
  value,
  onChange,
  columns,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  /** Force a column count; default auto (1 col for long labels, up to 3 for short). */
  columns?: number;
}) {
  const longest = options.reduce((m, o) => Math.max(m, o.label.length), 0);
  const cols = columns ?? (longest > 28 ? 1 : longest > 14 ? 2 : 3);
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <OptionCard
          key={o.value}
          label={o.label}
          control="radio"
          selected={value === o.value}
          onClick={() => onChange(value === o.value ? "" : o.value)}
        />
      ))}
    </div>
  );
}
