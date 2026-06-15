"use client";

import type { TimeRangeAnswer } from "@/lib/types";
import { FIELD_CLASS, LABEL_CLASS } from "./fieldStyles";

function to12hLabel(time24: string): string {
  const [hRaw, mRaw] = time24.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) {
    return "09:00AM";
  }
  const meridiem = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")}${meridiem}`;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { value, label: to12hLabel(value) };
});

function TimeSelectGroup({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select className={FIELD_CLASS} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}>
        <option value="">{placeholder}</option>
        {TIME_OPTIONS.map((time) => (
          <option key={time.value} value={time.value}>
            {time.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TimeRangeInput({
  value,
  onChange,
  onBlur,
}: {
  value: TimeRangeAnswer | undefined;
  onChange: (value: TimeRangeAnswer) => void;
  onBlur?: () => void;
}) {
  const v: TimeRangeAnswer = {
    open: value?.open ?? "",
    close: value?.close ?? "",
    saturdayOpen: value?.saturdayOpen ?? false,
    sundayOpen: value?.sundayOpen ?? false,
    alwaysOpen: value?.alwaysOpen ?? false,
  };

  const applyAlwaysOpen = (checked: boolean) => {
    onChange({
      ...v,
      alwaysOpen: checked,
      open: checked ? "00:00" : v.open,
      close: checked ? "23:59" : v.close,
      saturdayOpen: checked ? true : v.saturdayOpen,
      sundayOpen: checked ? true : v.sundayOpen,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-ink">Monday to Friday</p>
      <div className="grid grid-cols-2 gap-4">
        <TimeSelectGroup
          label="Opens"
          placeholder="Select Open Time"
          value={v.open}
          onChange={(next) => onChange({ ...v, open: next })}
          onBlur={onBlur}
        />
        <TimeSelectGroup
          label="Closes"
          placeholder="Select Close Time"
          value={v.close}
          onChange={(next) => onChange({ ...v, close: next })}
          onBlur={onBlur}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
        <p className="text-sm font-semibold text-ink">Saturday</p>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="opening-saturday"
            checked={!v.saturdayOpen}
            onChange={() => onChange({ ...v, saturdayOpen: false })}
            onBlur={onBlur}
            disabled={v.alwaysOpen}
          />
          We are closed
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="opening-saturday"
            checked={Boolean(v.saturdayOpen)}
            onChange={() => onChange({ ...v, saturdayOpen: true })}
            onBlur={onBlur}
            disabled={v.alwaysOpen}
          />
          We are open
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
        <p className="text-sm font-semibold text-ink">Sunday</p>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="opening-sunday"
            checked={!v.sundayOpen}
            onChange={() => onChange({ ...v, sundayOpen: false })}
            onBlur={onBlur}
            disabled={v.alwaysOpen}
          />
          We are closed
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="opening-sunday"
            checked={Boolean(v.sundayOpen)}
            onChange={() => onChange({ ...v, sundayOpen: true })}
            onBlur={onBlur}
            disabled={v.alwaysOpen}
          />
          We are open
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" checked={Boolean(v.alwaysOpen)} onChange={(e) => applyAlwaysOpen(e.target.checked)} onBlur={onBlur} />
        24 X 7 Open
      </label>
    </div>
  );
}
