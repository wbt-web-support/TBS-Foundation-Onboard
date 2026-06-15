"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ImagePreviewModal({
  src,
  alt,
  onClose,
  variant = "default",
}: {
  src: string;
  alt: string;
  onClose: () => void;
  /** `template` — tall full-page mockups (scrollable, full width). */
  variant?: "default" | "template";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  const isTemplate = variant === "template";

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-rail/92 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isTemplate ? `Preview: ${alt}` : "Image preview"}
    >
      {isTemplate ? (
        <div
          className="flex max-h-[94vh] w-full max-w-[min(96vw,1280px)] flex-col overflow-hidden rounded-xl border border-b1 bg-panel shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-b1 bg-surface px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{alt}</p>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-b2 bg-panel px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface">
            <img src={src} alt={alt} className="block h-auto w-full" />
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
          >
            Close
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[min(96vw,1200px)] rounded-lg border border-white/20 bg-panel object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}
    </div>,
    document.body,
  );
}
