import type { ClientSubmissionRecord } from "@/lib/admin/clients";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-50 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800 sm:col-span-2 break-all">{value ?? "—"}</dd>
    </div>
  );
}

export function SubmissionRecordPanel({ record }: { record: ClientSubmissionRecord }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-700">Database record</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          All columns from <code className="rounded bg-slate-100 px-1">onboarding_submissions</code>
        </p>
      </header>
      <dl className="px-6 pb-2">
        <Row label="id" value={record.id} />
        <Row label="resume_token" value={record.resumeToken} />
        <Row label="email" value={record.email} />
        <Row label="phone" value={record.phone} />
        <Row label="tax_identification_number" value={record.taxIdentificationNumber} />
        <Row label="current_section_index" value={String(record.currentSectionIndex)} />
        <Row label="satisfaction_rating" value={record.satisfactionRating ?? "—"} />
        <Row
          label="completed"
          value={
            <span
              className={
                record.completed ? "font-medium text-emerald-700" : "font-medium text-amber-700"
              }
            >
              {record.completed ? "true" : "false"}
            </span>
          }
        />
        <Row
          label="completion_pdf"
          value={record.hasCompletionPdf ? "Stored in database (bytea)" : "—"}
        />
        <Row label="completion_pdf_filename" value={record.completionPdfFilename} />
        <Row label="created_at" value={fmt(record.createdAt)} />
        <Row label="updated_at" value={fmt(record.updatedAt)} />
      </dl>
    </section>
  );
}
