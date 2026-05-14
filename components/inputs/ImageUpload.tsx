"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { Icon } from "@/components/ui/Icon";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";

function fileName(urlOrPath: string): string {
  try {
    const clean = urlOrPath.split("?")[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "Uploaded image";
  } catch {
    return "Uploaded image";
  }
}

function extension(fileNameValue: string): string {
  const match = fileNameValue.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function validateImage(file: File, maxSizeMB: number): string | null {
  const validExt = ["jpg", "jpeg", "png", "webp"];
  const ext = extension(file.name);
  if (!validExt.includes(ext)) {
    return "Please upload a JPG, JPEG, PNG, or WEBP image.";
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Image is too large. Maximum size is ${maxSizeMB}MB.`;
  }
  return null;
}

export function ImageUpload({
  questionId,
  value,
  onChange,
  maxSizeMB = 5,
}: {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  maxSizeMB?: number;
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

  const helperText = useMemo(
    () => `Drag & drop or click to upload (JPG, PNG, WEBP up to ${maxSizeMB}MB)`,
    [maxSizeMB],
  );

  const processFile = async (file: File) => {
    setError(null);
    const validationError = validateImage(file, maxSizeMB);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const stored = await uploadFile(questionId, file);
      onChange(stored);
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }
    } catch {
      setError("Image upload failed. Please try again.");
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
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void processFile(f);
        }}
      />

      {hasPreview ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-slate-700">
            <Icon
              name={value ? "check" : "upload"}
              className={`size-4 shrink-0 ${value ? "text-emerald-600" : "text-slate-500"}`}
            />
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
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
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setError(null);
                if (localPreview) {
                  URL.revokeObjectURL(localPreview);
                  setLocalPreview(null);
                }
              }}
              disabled={uploading}
              className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              Remove
            </button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
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
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm transition disabled:opacity-50 ${
            dragging
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600"
          }`}
        >
          <Icon name="upload" className="size-5" />
          <span>{uploading ? "Uploading..." : "Choose an image to upload"}</span>
          <span className="text-xs text-muted">{helperText}</span>
        </button>
      )}

      {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}

      {previewOpen && previewSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
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
            className="max-h-[85vh] max-w-[90vw] rounded-lg border border-white/20 bg-white object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
