import type { ClientSubmissionRecord } from "@/lib/admin/clients";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 dark:border-slate-700 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="break-all text-sm text-slate-800 dark:text-slate-200 sm:col-span-2">{value ?? "—"}</dd>
    </div>
  );
}

export function SubmissionRecordPanel({ record }: { record: ClientSubmissionRecord }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <header className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Database record</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          All columns from <code className="rounded bg-slate-100 px-1 dark:bg-slate-700 dark:text-slate-300">onboarding_submissions</code>
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
            <span className={record.completed ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-amber-600 dark:text-amber-400"}>
              {record.completed ? "true" : "false"}
            </span>
          }
        />
        <Row label="completion_pdf" value={record.hasCompletionPdf ? "Stored in database (bytea)" : "—"} />
        <Row label="completion_pdf_filename" value={record.completionPdfFilename} />
        <Row label="created_at" value={fmt(record.createdAt)} />
        <Row label="updated_at" value={fmt(record.updatedAt)} />
      </dl>
    </section>
  );
}
