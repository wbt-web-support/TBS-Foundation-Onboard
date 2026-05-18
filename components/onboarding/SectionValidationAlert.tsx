"use client";

export function SectionValidationAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <span
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-rose-600 text-xs font-bold text-white"
        aria-hidden
      >
        !
      </span>
      <p>{message}</p>
    </div>
  );
}
