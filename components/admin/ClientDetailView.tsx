import Link from "next/link";
import { AdminNotesPanel } from "@/components/admin/AdminNotesPanel";
import { ClientUploadsGallery } from "@/components/admin/ClientUploadsGallery";
import { DownloadPdfButton } from "@/components/admin/DownloadPdfButton";
import { ResendEmailButton } from "@/components/admin/ResendEmailButton";
import { SendReminderButton } from "@/components/admin/SendReminderButton";
import { SubmissionPdfPreview } from "@/components/admin/SubmissionPdfPreview";
import { SubmissionRecordPanel } from "@/components/admin/SubmissionRecordPanel";
import { Icon } from "@/components/ui/Icon";
import { isSubmissionId } from "@/lib/admin/submissionId";
import type { ClientDetail } from "@/lib/admin/clients";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ completed, percentComplete }: { completed: boolean; percentComplete: number }) {
  const done = completed || percentComplete >= 100;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
      done
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    }`}>
      {done ? "Completed" : "In progress"}
    </span>
  );
}

export function ClientDetailView({ client }: { client: ClientDetail }) {
  return (
    <div className="space-y-8">
      {/* ── Summary card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Client</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{client.companyName}</h1>
            <div className="mt-3">
              <StatusBadge completed={client.completed} percentComplete={client.percentComplete} />
            </div>
          </div>
          <div className="text-right text-sm text-slate-500 dark:text-slate-400">
            <p>Created {fmtDate(client.createdAt)}</p>
            <p className="mt-1">Last activity {fmtDate(client.lastActivityAt)}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Progress",  value: `${client.percentComplete}%` },
            { label: "Questions", value: `${client.filledQuestions} of ${client.totalQuestions} answered` },
            { label: "Stuck at",  value: client.completed ? "—" : (client.currentQuestionTitle ?? "—") },
            { label: "Section",   value: client.completed ? "—" : (client.currentSectionName ?? "—") },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {client.email
                ? <a href={`mailto:${client.email}`} className="text-brand-600 hover:underline dark:text-brand-400">{client.email}</a>
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Phone</dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">{client.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Tax ID</dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">{client.taxId ?? "—"}</dd>
          </div>
          {client.satisfactionRating != null && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Satisfaction</dt>
              <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">{client.satisfactionRating} / 10</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap items-start gap-3">
          {(client.completed || client.percentComplete >= 100) && client.canDownloadPdf && isSubmissionId(client.id) && (
            <DownloadPdfButton
              submissionId={client.id}
              variant="card"
              label="Download submission PDF"
              subtitle={
                client.pdfUrl
                  ? "Same file as the PDF link in the completion email (Bunny)"
                  : client.hasStoredPdf
                    ? "Saved when the form was submitted"
                    : "Generated from form answers"
              }
            />
          )}
          {(client.completed || client.percentComplete >= 100) && client.pdfUrl && (
            <a
              href={client.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <Icon name="link" className="size-5 text-brand-600 dark:text-brand-400" />
              <span>
                Open Bunny PDF link
                <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">Direct Bunny CDN URL</span>
              </span>
            </a>
          )}
          <Link
            href={client.refId != null ? `/?id=${client.refId}` : `/?token=${client.resumeToken}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40"
          >
            <Icon name="link" className="size-4" />
            Open form (resume link)
          </Link>
          {client.completed && client.email && isSubmissionId(client.id) && (
            <ResendEmailButton submissionId={client.id} />
          )}
          {!client.completed && client.percentComplete < 100 && client.email && isSubmissionId(client.id) && (
            <SendReminderButton submissionId={client.id} />
          )}
        </div>
      </section>

      {/* ── DB record ── */}
      <SubmissionRecordPanel record={client.record} />

      {/* ── PDF preview ── */}
      {client.completed && isSubmissionId(client.id) && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Submission PDF</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Preview of the completed questionnaire PDF (same as emailed to admin)
            </p>
          </div>
          <div className="p-6">
            <SubmissionPdfPreview submissionId={client.id} />
          </div>
        </section>
      )}

      {/* ── Uploads ── */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Uploaded images & documents</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Bunny / storage files · {client.imageCount} image(s)
          </p>
        </div>
        <div className="p-6">
          <ClientUploadsGallery documents={client.documents} submissionId={client.id} />
        </div>
      </section>

      {/* ── Admin notes ── */}
      {isSubmissionId(client.id) && (
        <AdminNotesPanel submissionId={client.id} initialNotes={client.adminNotes} />
      )}

      {/* ── Questionnaire responses ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Questionnaire responses</h2>
        {client.sections.map((section) => (
          <article key={section.title} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <header className="border-b border-slate-100 bg-slate-50/80 px-6 py-3 dark:border-slate-700 dark:bg-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{section.title}</h3>
            </header>
            <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-700">
              {section.fields.map((field, i) => (
                <div key={`${field.label}-${i}`} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{field.label}</dt>
                  <dd className="text-sm text-slate-800 dark:text-slate-200 sm:col-span-2">
                    {field.href ? (
                      <a
                        href={field.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {field.value}
                      </a>
                    ) : (
                      <span className="whitespace-pre-wrap">{field.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}
