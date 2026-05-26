"use client";

import { Button } from "@/components/ui/Button";

export interface ResumeRestoreModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStartOver: () => void;
}

export function ResumeRestoreModal({ open, onClose, onContinue, onStartOver }: ResumeRestoreModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-restore-title"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-8 pb-8 pt-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-[var(--color-intro-cta)] text-white shadow-md transition hover:bg-[var(--color-intro-cta-hover)]"
          aria-label="Close and continue"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ×
          </span>
        </button>
        <h2 id="resume-restore-title" className="pr-10 text-center text-xl font-semibold text-slate-900">
          Form successfully restored
        </h2>
        <p className="mt-4 text-center text-[15px] leading-relaxed text-slate-600">
          The form has been recovered from your most recent changes. If you&apos;d like to resume, simply close the
          popup. And, if you wish to start again, click the button below.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="introCta" onClick={onStartOver} className="!normal-case sm:flex-1">
            Start Over
          </Button>
          <Button type="button" variant="introCta" onClick={onContinue} className="!normal-case sm:flex-1">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
