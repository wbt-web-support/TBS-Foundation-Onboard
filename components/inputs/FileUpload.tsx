"use client";

import { useRef, useState } from "react";
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
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-slate-700">
            <Icon name="check" className="size-4 shrink-0 text-emerald-600" />
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
            >
              {fileName(value)}
            </a>
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
        >
          <Icon name="upload" className="size-5" />
          {uploading ? "Uploading…" : "Choose a file to upload"}
        </button>
      )}
      {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
