"use client";

import { useEffect, useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";
import { fetchSubmissionPdfBlob } from "@/lib/admin/submissionPdf";
import { isSubmissionId } from "@/lib/admin/submissionId";

/** Inline PDF preview for a completed submission (authenticated admin API). */
export function SubmissionPdfPreview({ submissionId }: { submissionId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSubmissionId(submissionId)) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { blob } = await fetchSubmissionPdfBlob(submissionId, adminFetchHeaders());
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load PDF");
          setSrc(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [submissionId]);

  if (!isSubmissionId(submissionId)) return null;

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!src) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
        <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="Submission PDF preview"
      className="h-[min(70vh,720px)] w-full rounded-lg border border-slate-200 bg-white"
    />
  );
}
