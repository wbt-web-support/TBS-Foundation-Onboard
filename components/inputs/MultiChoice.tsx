"use client";

import type { Option } from "@/lib/schema/types";
import { OptionCard } from "./OptionCard";

export function MultiChoice({
  options,
  value,
  onChange,
  columns,
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Force column count (e.g. 2 for a two-column checkbox grid). */
  columns?: number;
}) {
  const hasImages = options.some((o) => o.imageUrl);
  const hasRichOptions = options.some((o) => o.description || o.example || o.warning);
  const longest = options.reduce((m, o) => Math.max(m, o.label.length), 0);
  const cols =
    columns ??
    (hasRichOptions
      ? 1
      : hasImages
        ? longest > 22
          ? 2
          : 3
        : longest > 28
          ? 1
          : longest > 14
            ? 2
            : 3);
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
          imageUrl={o.imageUrl}
          linkUrl={o.linkUrl}
          description={o.description}
          example={o.example}
          warning={o.warning}
          control="checkbox"
          selected={value.includes(o.value)}
          onClick={() => toggle(o.value)}
        />
      ))}
    </div>
  );
}
