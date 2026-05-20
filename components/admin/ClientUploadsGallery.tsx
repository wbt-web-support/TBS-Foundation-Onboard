"use client";

import { useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";
import { Icon } from "@/components/ui/Icon";
import type { ClientDocument } from "@/lib/admin/clients";
import { fetchSubmissionPdfBlob, isAdminPdfApiUrl } from "@/lib/admin/submissionPdf";
import { isSubmissionId } from "@/lib/admin/submissionId";


function SubmissionPdfLink({
  submissionId,
  label,
}: {
  submissionId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  const open = async () => {
    if (!isSubmissionId(submissionId)) return;
    setLoading(true);
    try {
      const { blob } = await fetchSubmissionPdfBlob(submissionId, adminFetchHeaders());
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline disabled:opacity-60"
    >
      <Icon name="sheet" className="size-4 text-red-600" />
      {loading ? "Opening…" : label}
    </button>
  );
}

export function ClientUploadsGallery({
  documents,
  submissionId,
}: {
  documents: ClientDocument[];
  submissionId: string;
}) {
  const submissionPdf = documents.find((d) => d.id.startsWith("completion-pdf"));
  const uploads = documents.filter((d) => !d.id.startsWith("completion-pdf"));
  const images = uploads.filter((d) => d.kind === "image");

  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!submissionPdf && images.length === 0) {
    return <p className="text-sm text-slate-400">No uploads found in this submission.</p>;
  }

  return (
    <div className="space-y-6">
      {submissionPdf && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Submission PDF</p>
          <p className="mt-1 text-sm text-slate-700">{submissionPdf.questionLabel ?? submissionPdf.label}</p>
          {isAdminPdfApiUrl(submissionPdf.url) ? (
            <SubmissionPdfLink submissionId={submissionId} label="Open PDF" />
          ) : (
            <a
              href={submissionPdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
            >
              <Icon name="sheet" className="size-4 text-red-600" />
              Open PDF (same as email)
            </a>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Images ({images.length})
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((doc) => (
              <li
                key={doc.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setLightbox(doc.url)}
                  className="block w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.url}
                    alt={doc.questionLabel ?? doc.label}
                    className="aspect-[4/3] w-full object-cover bg-slate-100"
                  />
                </button>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-xs font-medium text-slate-700">
                    {doc.questionLabel ?? doc.label}
                  </p>
                  {doc.sectionName && (
                    <p className="text-[10px] text-slate-500">{doc.sectionName}</p>
                  )}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:underline"
                  >
                    <Icon name="link" className="size-3" />
                    Open full size
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}


      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Upload preview"
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
