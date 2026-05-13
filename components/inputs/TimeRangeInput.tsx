"use client";

import type { TimeRangeAnswer } from "@/lib/types";
import { FIELD_CLASS, LABEL_CLASS } from "./fieldStyles";

export function TimeRangeInput({
  value,
  onChange,
  onBlur,
}: {
  value: TimeRangeAnswer | undefined;
  onChange: (value: TimeRangeAnswer) => void;
  onBlur?: () => void;
}) {
  const v: TimeRangeAnswer = value ?? { open: "", close: "" };
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={LABEL_CLASS}>Opens</label>
        <input
          type="time"
          className={FIELD_CLASS}
          value={v.open}
          onChange={(e) => onChange({ ...v, open: e.target.value })}
          onBlur={onBlur}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Closes</label>
        <input
          type="time"
          className={FIELD_CLASS}
          value={v.close}
          onChange={(e) => onChange({ ...v, close: e.target.value })}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
