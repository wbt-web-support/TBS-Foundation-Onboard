"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { Icon } from "@/components/ui/Icon";

function fileName(urlOrPath: string): string {
  try {
    const clean = urlOrPath.split("?")[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "Uploaded file";
  } catch {
    return "Uploaded file";
  }
}

function isLikelyImageUrl(urlOrPath: string): boolean {
  const path = urlOrPath.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\b|$)/.test(path);
}

export function FileUpload({
  questionId,
  value,
  onChange,
}: {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { uploadFile } = useOnboarding();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [value]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  const canImagePreview = Boolean(value && isLikelyImageUrl(value) && !imagePreviewFailed);

  const handlePick = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const stored = await uploadFile(questionId, file);
      onChange(stored);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handlePick(f);
        }}
      />
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-b1 bg-surface px-3.5 py-3 text-sm">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-ink">
            <Icon name="check" className="size-4 shrink-0 text-green" />
            {canImagePreview ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="shrink-0 overflow-hidden rounded-md border border-b1 bg-panel ring-brand-500/40 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                aria-label="Preview uploaded image"
              >
                <img
                  src={value}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-10 object-cover"
                  onError={() => setImagePreviewFailed(true)}
                />
              </button>
            ) : null}
            {canImagePreview ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="min-w-0 truncate text-left hover:underline"
              >
                {fileName(value)}
              </button>
            ) : (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 truncate hover:underline"
              >
                {fileName(value)}
              </a>
            )}
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Replace"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-b2 px-4 py-6 text-sm text-mid transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
        >
          <Icon name="upload" className="size-5" />
          {uploading ? "Uploading…" : "Choose a file to upload"}
        </button>
      )}
      {error ? <p className="mt-1.5 text-xs text-red">{error}</p> : null}

      {previewOpen && canImagePreview && value ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-rail/80 p-4"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            Close
          </button>
          <img
            src={value}
            alt={fileName(value)}
            className="max-h-[85vh] max-w-[90vw] rounded-lg border border-white/20 bg-panel object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
