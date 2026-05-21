"use client";

import type { Option } from "@/lib/schema/types";
import { OptionCard } from "./OptionCard";

function columnCount(
  options: Option[],
  mode: "single" | "multiple",
  columns: number | undefined,
): number {
  if (columns != null) return columns;
  const hasImages = options.some((o) => o.imageUrl);
  const hasRichOptions = options.some((o) => o.description || o.example || o.warning);
  const longest = options.reduce((m, o) => Math.max(m, o.label.length), 0);
  if (mode === "single") {
    return hasRichOptions ? 1 : longest > 28 ? 1 : longest > 14 ? 2 : 3;
  }
  return hasRichOptions
    ? 1
    : hasImages
      ? longest > 22
        ? 2
        : 3
      : longest > 28
        ? 1
        : longest > 14
          ? 2
          : 3;
}

type ChoiceGroupBase = {
  options: Option[];
  columns?: number;
  onBlur?: () => void;
  className?: string;
  /** Sets `id` on the grid for `aria-labelledby` / anchor links. */
  groupId?: string;
  /** Force image-tile layout for all cards (works with single or multiple). */
  tile?: boolean;
};

type ChoiceGroupSingle = ChoiceGroupBase & {
  mode: "single";
  value: string;
  onChange: (value: string) => void;
};

type ChoiceGroupMultiple = ChoiceGroupBase & {
  mode: "multiple";
  value: string[];
  onChange: (value: string[]) => void;
};

export type ChoiceGroupProps = ChoiceGroupSingle | ChoiceGroupMultiple;

/**
 * Unified option list: `single` uses radio-style controls; `multiple` uses checkboxes.
 * Used by top-level questions, field-group sub-fields, and year lists.
 */
export function ChoiceGroup(props: ChoiceGroupProps) {
  const { options, columns, onBlur, className = "", groupId, tile } = props;
  const cols = columnCount(options, props.mode, columns);
  const gridClass = "grid gap-2.5";
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } as const;

  if (props.mode === "single") {
    const { value, onChange } = props;
    return (
      <div
        id={groupId}
        className={`${gridClass} ${className}`}
        style={gridStyle}
        role="radiogroup"
        onBlur={onBlur}
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
            control="radio"
            tile={tile}
            selected={value === o.value}
            onClick={() => onChange(value === o.value ? "" : o.value)}
          />
        ))}
      </div>
    );
  }

  const { value, onChange } = props;
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div id={groupId} className={`${gridClass} ${className}`} style={gridStyle} role="group" onBlur={onBlur}>
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
          tile={tile}
          selected={value.includes(o.value)}
          onClick={() => toggle(o.value)}
        />
      ))}
    </div>
  );
}
