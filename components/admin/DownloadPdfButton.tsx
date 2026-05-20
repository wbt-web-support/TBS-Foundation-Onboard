"use client";

import { useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";
import { Icon } from "@/components/ui/Icon";
import { fetchSubmissionPdfBlob } from "@/lib/admin/submissionPdf";
import { isSubmissionId } from "@/lib/admin/submissionId";

type Props = {
  submissionId: string;
  label?: string;
  subtitle?: string;
  variant?: "inline" | "card";
  className?: string;
  showPreview?: boolean;
};

/** Downloads submission PDF (Bunny/email copy first, then DB, then regenerated). */
export function DownloadPdfButton({
  submissionId,
  label = "Download PDF",
  subtitle,
  variant = "inline",
  className = "",
  showPreview = true,
}: Props) {
  const [loading, setLoading] = useState<"download" | "preview" | null>(null);

  const run = async (mode: "download" | "preview") => {
    if (!isSubmissionId(submissionId)) return;
    setLoading(mode);
    try {
      const { blob, filename } = await fetchSubmissionPdfBlob(submissionId, adminFetchHeaders());
      const url = URL.createObjectURL(blob);

      if (mode === "preview") {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setLoading(null);
    }
  };

  if (!isSubmissionId(submissionId)) return null;

  const busy = loading !== null;

  if (variant === "card") {
    return (
      <div className={`inline-flex flex-col gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => run("download")}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-white disabled:opacity-60"
        >
          <Icon name="sheet" className="size-5 shrink-0 text-red-600" />
          <span>
            {loading === "download" ? "Downloading…" : label}
            {subtitle && (
              <span className="mt-0.5 block text-left text-xs font-normal text-slate-500">
                {subtitle}
              </span>
            )}
          </span>
        </button>
        {showPreview && (
          <button
            type="button"
            onClick={() => run("preview")}
            disabled={busy}
            className="text-left text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
          >
            {loading === "preview" ? "Opening…" : "Preview PDF in browser"}
          </button>
        )}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => run("download")}
        disabled={busy}
        className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline disabled:opacity-60"
      >
        <Icon name="sheet" className="size-4 text-red-600" />
        {loading === "download" ? "Downloading…" : label}
      </button>
      {showPreview && (
        <button
          type="button"
          onClick={() => run("preview")}
          disabled={busy}
          className="text-xs text-slate-500 hover:text-brand-600 disabled:opacity-60"
        >
          {loading === "preview" ? "…" : "Preview"}
        </button>
      )}
    </span>
  );
}
