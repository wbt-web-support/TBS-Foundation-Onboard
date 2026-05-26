"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGate, adminFetchHeaders } from "@/components/admin/AdminGate";
import { ClientEditModal } from "@/components/admin/ClientEditModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DownloadPdfButton } from "@/components/admin/DownloadPdfButton";
import { SendReminderButton } from "@/components/admin/SendReminderButton";
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
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${percent >= 100 ? "bg-emerald-500" : "bg-brand-500"}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-600 dark:text-slate-400">{percent}%</span>
    </div>
  );
}

type DashboardStats = { total: number; completed: number; inProgress: number };

type SortKey = "companyName" | "percentComplete" | "filledQuestions" | "currentSectionIndex" | "createdAt" | "updatedAt";

function exportToCsv(clients: ClientListItem[]) {
  const headers = ["Name", "Email", "Phone", "Tax ID", "Progress %", "Questions", "Status", "Created", "Updated"];
  const rows = clients.map((c) => [
    c.companyName,
    c.email ?? "",
    c.phone ?? "",
    c.taxId ?? "",
    String(c.percentComplete),
    `${c.filledQuestions}/${c.totalQuestions}`,
    c.completed || c.percentComplete >= 100 ? "Completed" : "In progress",
    c.createdAt,
    c.updatedAt,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function ClientsPageContent({ user: _user }: { user: AuthUser }) {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const [editClient, setEditClient] = useState<ClientListItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteClient, setDeleteClient] = useState<ClientListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortedClients = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...clients].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [clients, sortKey, sortDir]);

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
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 sm:text-xl">Form progress dashboard</h1>
              <p className="mt-0.5 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                All rows from{" "}
                <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-700 dark:text-slate-300">
                  onboarding_submissions
                </code>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => loadClients()}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => exportToCsv(sortedClients)}
                disabled={loading || clients.length === 0}
                className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 sm:inline-flex"
              >
                Export CSV
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "completed", "in_progress"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {f === "all" ? `All (${stats.total})` : f === "completed" ? `Completed (${stats.completed})` : `In progress (${stats.inProgress})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:px-5 sm:py-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:text-xs">Total</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800 dark:text-slate-100 sm:mt-1 sm:text-2xl">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-900/20 sm:px-5 sm:py-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400 sm:text-xs">Completed</p>
            <p className="mt-0.5 text-xl font-bold text-emerald-800 dark:text-emerald-300 sm:mt-1 sm:text-2xl">{stats.completed}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-3 shadow-sm dark:border-amber-800/40 dark:bg-amber-900/20 sm:px-5 sm:py-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400 sm:text-xs">In progress</p>
            <p className="mt-0.5 text-xl font-bold text-amber-800 dark:text-amber-300 sm:mt-1 sm:text-2xl">{stats.inProgress}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, tax ID…"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:focus:ring-brand-900/30 sm:max-w-md"
          />
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 dark:border-slate-600" />
          </div>
        ) : sortedClients.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">No clients found.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {sortedClients.map((client) => {
                const isDone = client.completed || client.percentComplete >= 100;
                return (
                  <div key={client.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{client.companyName}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{client.email ?? "—"}</p>
                        {client.phone && <p className="text-xs text-slate-400 dark:text-slate-500">{client.phone}</p>}
                      </div>
                      <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        isDone
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {isDone ? "Completed" : "In progress"}
                      </span>
                    </div>

                    <div className="mt-3">
                      <ProgressBar percent={client.percentComplete} />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {client.filledQuestions}/{client.totalQuestions} questions
                        {!isDone && client.currentSectionName && ` · ${client.currentSectionName}`}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {client.canDownloadPdf && isSubmissionId(client.id) && (
                        <DownloadPdfButton submissionId={client.id} label="PDF" showPreview={false} />
                      )}
                      {!isDone && client.email && isSubmissionId(client.id) && (
                        <SendReminderButton submissionId={client.id} />
                      )}
                      {isSubmissionId(client.id) && (
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Icon name="search" className="size-3.5" />
                          View
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditClient(client)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Icon name="sheet" className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteClient(client)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400">
                      {(
                        [
                          ["Client", "companyName"],
                          ["Phone", null],
                          ["Tax ID", null],
                          ["Progress", "percentComplete"],
                          ["Questions", "filledQuestions"],
                          ["Section #", "currentSectionIndex"],
                          ["Stuck at", null],
                          ["Rating", null],
                          ["Status", null],
                          ["PDF", null],
                          ["Created", "createdAt"],
                          ["Updated", "updatedAt"],
                        ] as [string, SortKey | null][]
                      ).map(([label, key]) =>
                        key ? (
                          <th key={label} className="cursor-pointer select-none px-4 py-3 hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort(key)}>
                            {label}{sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                          </th>
                        ) : (
                          <th key={label} className="px-4 py-3">{label}</th>
                        )
                      )}
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedClients.map((client) => (
                      <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:border-slate-700/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{client.companyName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{client.email ?? "—"}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500" title={client.id}>{client.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{client.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{client.taxId ?? "—"}</td>
                        <td className="px-4 py-3"><ProgressBar percent={client.percentComplete} /></td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{client.filledQuestions} / {client.totalQuestions}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {client.currentSectionIndex + 1}
                          {!client.completed && client.currentSectionName && (
                            <p className="truncate text-xs text-slate-400 dark:text-slate-500" title={client.currentSectionName}>{client.currentSectionName}</p>
                          )}
                        </td>
                        <td className="max-w-[160px] px-4 py-3 text-slate-600 dark:text-slate-400">
                          <p className="truncate" title={client.currentQuestionTitle ?? undefined}>
                            {client.completed ? "—" : (client.currentQuestionTitle ?? "—")}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {client.satisfactionRating != null ? `${client.satisfactionRating}/10` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            client.completed || client.percentComplete >= 100
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {client.completed || client.percentComplete >= 100 ? "Completed" : "In progress"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {client.canDownloadPdf && isSubmissionId(client.id) ? (
                            <DownloadPdfButton submissionId={client.id} label={client.pdfUrl ? "Email PDF" : "PDF"} showPreview={false} />
                          ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(client.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(client.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            {!client.completed && client.percentComplete < 100 && client.email && isSubmissionId(client.id) && (
                              <SendReminderButton submissionId={client.id} />
                            )}
                            {isSubmissionId(client.id) && (
                              <Link
                                href={`/admin/clients/${client.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                <Icon name="search" className="size-3.5" />
                                View
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditClient(client)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              <Icon name="sheet" className="size-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteClient(client)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
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
            </div>
          </>
        )}
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
