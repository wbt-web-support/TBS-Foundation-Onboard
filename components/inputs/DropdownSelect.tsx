"use client";

import type { Option } from "@/lib/schema/types";
import { Icon } from "@/components/ui/Icon";
import { FIELD_CLASS } from "./fieldStyles";

const CHEVRON_BG =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")";

/**
 * Native dropdown for long or compact option lists (e.g. country, organisation type).
 * Use `ChoiceGroup` + `SingleChoice` when options should show as radio cards.
 */
export function DropdownSelect({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Select…",
  disabled,
  leadingIcon,
}: {
  id?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  leadingIcon?: string;
}) {
  const selectEl = (
    <select
      id={id}
      disabled={disabled}
      className={`${FIELD_CLASS} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9${leadingIcon ? " pl-9" : ""}`}
      style={{ backgroundImage: CHEVRON_BG }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (!leadingIcon) return selectEl;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon name={leadingIcon} className="size-[18px]" />
      </span>
      {selectEl}
    </div>
  );
}
