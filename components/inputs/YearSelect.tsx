"use client";

import { FIELD_CLASS } from "./fieldStyles";

const CHEVRON_BG =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")";

export function YearSelect({
  id,
  from,
  to,
  value,
  onChange,
  onBlur,
  beforeEarliestLabel,
}: {
  id?: string;
  from: number;
  to: number;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Optional catch-all option shown after the earliest year (e.g. "Before 1970"). */
  beforeEarliestLabel?: string;
}) {
  const years: number[] = [];
  for (let y = to; y >= from; y--) years.push(y);

  return (
    <select
      id={id}
      className={`${FIELD_CLASS} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9`}
      style={{ backgroundImage: CHEVRON_BG }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    >
      <option value="" disabled>
        Select year…
      </option>
      {years.map((y) => (
        <option key={y} value={String(y)}>
          {y}
        </option>
      ))}
      {beforeEarliestLabel && (
        <option value={`before-${from}`}>{beforeEarliestLabel}</option>
      )}
    </select>
  );
}
