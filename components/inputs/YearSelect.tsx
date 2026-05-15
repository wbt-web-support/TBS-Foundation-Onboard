"use client";

import type { Option } from "@/lib/schema/types";
import { ChoiceGroup } from "./ChoiceGroup";

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
    <ChoiceGroup
      mode="single"
      options={years}
      value={value}
      onChange={onChange}
      columns={4}
      onBlur={onBlur}
      className="max-h-56 overflow-y-auto pr-1"
      groupId={id}
    />
  );
}
