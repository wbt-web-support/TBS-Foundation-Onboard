"use client";

export function SectionValidationAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex gap-3 rounded-lg border border-red bg-red-tint px-4 py-3 text-sm text-red"
    >
      <span
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-red text-xs font-bold text-white"
        aria-hidden
      >
        !
      </span>
      <p>{message}</p>
    </div>
  );
}
