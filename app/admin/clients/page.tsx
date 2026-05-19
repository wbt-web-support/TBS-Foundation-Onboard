"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminGate, adminFetchHeaders } from "@/components/admin/AdminGate";
import { ClientEditModal } from "@/components/admin/ClientEditModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DownloadPdfButton } from "@/components/admin/DownloadPdfButton";
import { Icon } from "@/components/ui/Icon";
import { isSubmissionId } from "@/lib/admin/submissionId";
import type { AuthUser } from "@/lib/admin/auth";
import type { ClientListItem } from "@/lib/admin/clients";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-600">{percent}%</span>
    </div>
  );
}

type DashboardStats = { total: number; completed: number; inProgress: number };

function ClientsPageContent({ user: _user }: { user: AuthUser }) {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">("all");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const [editClient, setEditClient] = useState<ClientListItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteClient, setDeleteClient] = useState<ClientListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (filter === "completed") params.set("completed", "true");
      if (filter === "in_progress") params.set("completed", "false");
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await fetch(`/api/admin/clients?${params}`, adminFetchHeaders());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load clients");
      setClients(data.clients ?? []);
      setStats(data.stats ?? { total: data.clients?.length ?? 0, completed: 0, inProgress: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [filter, searchDebounced]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSaveEdit = async (payload: {
    email: string;
    phone: string;
    tax_identification_number: string;
    completed: boolean;
  }) => {
    if (!editClient) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${editClient.id}`, {
        ...adminFetchHeaders(),
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Update failed");
      setEditClient(null);
      await loadClients();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteClient) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${deleteClient.id}`, {
        ...adminFetchHeaders(),
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Delete failed");
      setDeleteClient(null);
      await loadClients();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Form progress dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              All rows from <code className="rounded bg-slate-100 px-1 text-xs">onboarding_submissions</code>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadClients()}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
            {(["all", "completed", "in_progress"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f === "all" ? "All" : f === "completed" ? "Completed" : "In progress"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total submissions</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{stats.completed}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">In progress</p>
            <p className="mt-1 text-2xl font-bold text-amber-800">{stats.inProgress}</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, phone, tax ID, company, submission id…"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="size-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
            </div>
          ) : clients.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No clients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Tax ID</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Section #</th>
                    <th className="px-4 py-3">Stuck at</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">PDF</th>
                    <th className="px-4 py-3">Images</th>
                    <th className="px-4 py-3">Files</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{client.companyName}</p>
                        <p className="text-xs text-slate-500">{client.email ?? "—"}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400" title={client.id}>
                          {client.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{client.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{client.taxId ?? "—"}</td>
                      <td className="px-4 py-3">
                        <ProgressBar percent={client.percentComplete} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {client.filledQuestions} / {client.totalQuestions}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {client.currentSectionIndex + 1}
                        {!client.completed && client.currentSectionName && (
                          <p className="truncate text-xs text-slate-400" title={client.currentSectionName}>
                            {client.currentSectionName}
                          </p>
                        )}
                      </td>
                      <td className="max-w-[180px] px-4 py-3 text-slate-600">
                        <p className="truncate" title={client.currentQuestionTitle ?? undefined}>
                          {client.completed ? "—" : (client.currentQuestionTitle ?? "—")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {client.satisfactionRating != null ? `${client.satisfactionRating}/10` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            client.completed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {client.completed ? "Completed" : "In progress"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {client.canDownloadPdf && isSubmissionId(client.id) ? (
                          <DownloadPdfButton
                            submissionId={client.id}
                            label={client.pdfUrl ? "Email PDF" : "PDF"}
                            showPreview={false}
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{client.imageCount}</td>
                      <td className="px-4 py-3 text-slate-600">{client.documentCount}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDateTime(client.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDateTime(client.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {isSubmissionId(client.id) ? (
                            <Link
                              href={`/admin/clients/${client.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
                            >
                              <Icon name="search" className="size-3.5" />
                              View
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setEditClient(client)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
                          >
                            <Icon name="sheet" className="size-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteClient(client)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ClientEditModal
        open={Boolean(editClient)}
        client={editClient}
        loading={editLoading}
        onClose={() => setEditClient(null)}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteClient)}
        title="Delete client?"
        message={
          deleteClient
            ? `Are you sure you want to permanently delete "${deleteClient.companyName}"? This removes their submission and cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteClient(null)}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <AdminGate>
      {(user) => <ClientsPageContent user={user} />}
    </AdminGate>
  );
}
