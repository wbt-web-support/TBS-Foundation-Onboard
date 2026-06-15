"use client";

import { useEffect } from "react";

const MESSAGE_EMAIL =
  "Your progress has been saved. An email has been sent with a link that allows you to continue from where you left off.";

const MESSAGE_LOCAL =
  "Your progress has been saved in this browser. Outbound email is not configured on the server, so no message was sent. Add RESEND_API_KEY or SMTP settings in .env.local to enable emailed resume links.";

export interface SaveSuccessBannerProps {
  open: boolean;
  /** When false, explains that only local save ran (no email). */
  emailSent?: boolean;
  onDismiss: () => void;
}

export function SaveSuccessBanner({ open, emailSent = true, onDismiss }: SaveSuccessBannerProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onDismiss(), 6000);
    return () => window.clearTimeout(t);
  }, [open, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-14 z-[1100] flex justify-center border-b border-b1 bg-panel px-4 py-3 shadow-md transition-[transform,opacity] duration-300 ease-out ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="relative flex w-full max-w-4xl items-start justify-center gap-4 text-center text-sm leading-relaxed text-ink">
        <p className="flex-1">{emailSent ? MESSAGE_EMAIL : MESSAGE_LOCAL}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-2 py-0.5 text-lg leading-none text-mid hover:bg-surface hover:text-ink"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
