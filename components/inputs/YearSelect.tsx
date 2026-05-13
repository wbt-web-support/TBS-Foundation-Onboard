"use client";

import type { Option } from "@/lib/schema/types";
import { SelectInput } from "./SelectInput";

export function YearSelect({
  id,
  from,
  to,
  value,
  onChange,
  onBlur,
}: {
  id?: string;
  from: number;
  to: number;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const years: Option[] = [];
  for (let y = to; y >= from; y--) years.push({ value: String(y), label: String(y) });
  return (
    <SelectInput
      id={id}
      options={years}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder="Select year"
    />
  );
}
