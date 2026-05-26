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
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {done ? "Completed" : "In progress"}
    </span>
  );
}

export function ClientDetailView({ client }: { client: ClientDetail }) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Client</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">{client.companyName}</h1>
            <div className="mt-3">
              <StatusBadge completed={client.completed} percentComplete={client.percentComplete} />
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Created {fmtDate(client.createdAt)}</p>
            <p className="mt-1">Last activity {fmtDate(client.lastActivityAt)}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Progress</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{client.percentComplete}%</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Questions</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {client.filledQuestions} of {client.totalQuestions} answered
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Stuck at</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {client.completed ? "—" : (client.currentQuestionTitle ?? "—")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Section</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {client.completed ? "—" : (client.currentSectionName ?? "—")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="text-brand-600 hover:underline">
                  {client.email}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</dt>
            <dd className="mt-1 text-sm text-slate-800">{client.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Tax ID</dt>
            <dd className="mt-1 text-sm text-slate-800">{client.taxId ?? "—"}</dd>
          </div>
          {client.satisfactionRating != null && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Satisfaction</dt>
              <dd className="mt-1 text-sm text-slate-800">{client.satisfactionRating} / 10</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap items-start gap-4">
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
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-200 hover:bg-white"
            >
              <Icon name="link" className="size-5 text-brand-600" />
              <span>
                Open Bunny PDF link
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Direct Bunny CDN URL
                </span>
              </span>
            </a>
          )}
          <Link
            href={client.refId != null ? `/?id=${client.refId}` : `/?token=${client.resumeToken}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
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

      <SubmissionRecordPanel record={client.record} />

      {client.completed && isSubmissionId(client.id) && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Submission PDF</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Preview of the completed questionnaire PDF (same as emailed to admin)
            </p>
          </div>
          <div className="p-6">
            <SubmissionPdfPreview submissionId={client.id} />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Uploaded images & documents</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Bunny / storage files · {client.imageCount} image(s)
          </p>
        </div>
        <div className="p-6">
          <ClientUploadsGallery documents={client.documents} submissionId={client.id} />
        </div>
      </section>

      {isSubmissionId(client.id) && (
        <AdminNotesPanel submissionId={client.id} initialNotes={client.adminNotes} />
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Questionnaire responses</h2>
        {client.sections.map((section) => (
          <article key={section.title} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
              <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
            </header>
            <dl className="divide-y divide-slate-50 px-6">
              {section.fields.map((field, i) => (
                <div key={`${field.label}-${i}`} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-slate-500">{field.label}</dt>
                  <dd className="text-sm text-slate-800 sm:col-span-2">
                    {field.href ? (
                      <a
                        href={field.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-brand-600 hover:underline"
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
