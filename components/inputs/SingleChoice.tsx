"use client";

import type { Option } from "@/lib/schema/types";
import { ChoiceGroup } from "./ChoiceGroup";

export function SingleChoice({
  options,
  value,
  onChange,
  columns,
  onBlur,
  className,
  groupId,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
  onBlur?: () => void;
  className?: string;
  groupId?: string;
}) {
  return (
    <ChoiceGroup
      mode="single"
      options={options}
      value={value}
      onChange={onChange}
      columns={columns}
      onBlur={onBlur}
      className={className}
      groupId={groupId}
    />
  );
}
