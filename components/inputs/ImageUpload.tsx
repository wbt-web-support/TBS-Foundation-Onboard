"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { imageUploadHelperText, IMAGE_ACCEPT, validateImageFile } from "@/lib/imageUpload";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { Icon } from "@/components/ui/Icon";

function fileName(urlOrPath: string): string {
  try {
    const clean = urlOrPath.split("?")[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "Uploaded image";
  } catch {
    return "Uploaded image";
  }
}

export function ImageUpload({
  questionId,
  value,
  onChange,
  maxSizeMB = 5,
  variant = "default",
  onActivate,
}: {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  maxSizeMB?: number;
  /** `compact` — fits inside gallery “Upload my own” card. */
  variant?: "default" | "compact";
  /** Called before opening the file picker (e.g. auto-select upload-own tile). */
  onActivate?: () => void;
}) {
  const { uploadFile } = useOnboarding();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const previewSrc = localPreview || value;
  const hasPreview = Boolean(value || localPreview);
  const isCompact = variant === "compact";

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const helperText = useMemo(() => imageUploadHelperText(maxSizeMB), [maxSizeMB]);

  const openPicker = () => {
    onActivate?.();
    inputRef.current?.click();
  };

  const processFile = async (file: File) => {
    onActivate?.();
    setError(null);
    const validationError = validateImageFile(file, maxSizeMB);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(objectUrl);
    setUploading(true);
    try {
      const stored = await uploadFile(questionId, file);
      onChange(stored);
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = () => {
    onChange("");
    setError(null);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
  };

  return (
    <div className={isCompact ? "flex h-full min-h-0 flex-col" : undefined}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void processFile(f);
        }}
      />

      {hasPreview ? (
        <div
          className={
            isCompact
              ? "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-b1 bg-panel px-2 py-2 text-center"
              : "flex items-center justify-between gap-3 rounded-lg border border-b1 bg-surface px-3.5 py-3 text-sm"
          }
        >
          {isCompact ? (
            <>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="min-h-0 w-full flex-1 overflow-hidden rounded-md border border-b1 bg-surface"
                aria-label="Preview uploaded image"
              >
                <img src={previewSrc} alt={fileName(value)} className="mx-auto h-full max-h-36 w-full object-contain" />
              </button>
              <p className="line-clamp-2 w-full text-[10px] font-medium text-mid">
                {fileName(value || "selected-image")}
              </p>
              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={uploading}
                  className="text-[10px] font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Replace"}
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={uploading}
                  className="text-[10px] font-medium text-mid hover:text-ink disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="flex min-w-0 items-center gap-2 text-ink">
                <Icon
                  name={value ? "check" : "upload"}
                  className={`size-4 shrink-0 ${value ? "text-green" : "text-mid"}`}
                />
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="shrink-0 overflow-hidden rounded-md border border-b1 bg-panel"
                  aria-label="Preview uploaded image"
                >
                  <img src={previewSrc} alt={fileName(value)} className="size-10 object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="truncate text-left hover:underline"
                >
                  {fileName(value || "selected-image")}
                </button>
              </span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={uploading}
                  className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Replace"}
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={uploading}
                  className="shrink-0 text-xs font-medium text-mid hover:text-ink disabled:opacity-50"
                >
                  Remove
                </button>
              </span>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) void processFile(dropped);
          }}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed transition disabled:opacity-50 ${
            isCompact ? "min-h-0 flex-1 gap-1.5 px-2 py-3 text-[11px]" : "gap-2 px-4 py-6 text-sm"
          } ${
            dragging
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-b2 text-mid hover:border-brand-400 hover:text-brand-600"
          }`}
        >
          <Icon name="upload" className="size-5" />
          <span className="font-medium">
            {uploading ? "Uploading…" : isCompact ? "Click to upload" : "Choose an image to upload"}
          </span>
          <span className={`text-muted ${isCompact ? "text-[10px] leading-tight" : "text-xs"}`}>{helperText}</span>
        </button>
      )}

      {error ? (
        <p className={`text-red ${isCompact ? "mt-1 text-center text-[10px]" : "mt-1.5 text-xs"}`}>{error}</p>
      ) : null}

      {previewOpen && previewSrc ? (
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
            src={previewSrc}
            alt={fileName(value || "image")}
            className="max-h-[85vh] max-w-[90vw] rounded-lg border border-white/20 bg-panel object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
