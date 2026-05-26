"use client";

import { useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";
import { Icon } from "@/components/ui/Icon";

type Props = {
  submissionId: string;
  onGenerated?: (pdfUrl: string | null) => void;
};

export function GeneratePdfButton({ submissionId, onGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [bunnyUrl, setBunnyUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${submissionId}/generate-pdf`, {
        ...adminFetchHeaders(),
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "PDF generation failed");
      setDone(true);
      setBunnyUrl(data.pdfUrl ?? null);
      onGenerated?.(data.pdfUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <Icon name="check" className="size-4 shrink-0" />
          PDF generated &amp; saved
        </div>
        {bunnyUrl && (
          <a
            href={bunnyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
          >
            <Icon name="link" className="size-3.5" />
            Open Bunny CDN link
          </a>
        )}
        {!bunnyUrl && (
          <p className="text-xs text-slate-500">Saved to database (Bunny not configured)</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:bg-brand-100 disabled:opacity-60"
      >
        <Icon name="sheet" className="size-5 shrink-0 text-brand-600" />
        <span>
          {loading ? "Generating…" : "Generate PDF & upload to Bunny"}
          <span className="mt-0.5 block text-xs font-normal text-brand-600/70">
            Builds PDF from answers, uploads to Bunny CDN
          </span>
        </span>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
