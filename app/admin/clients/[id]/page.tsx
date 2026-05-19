"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminGate, adminFetchHeaders } from "@/components/admin/AdminGate";
import { ClientDetailView } from "@/components/admin/ClientDetailView";
import { ClientEditModal } from "@/components/admin/ClientEditModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import type { AuthUser } from "@/lib/admin/auth";
import { isSubmissionId, parseSubmissionIdParam } from "@/lib/admin/submissionId";
import type { ClientDetail, ClientListItem } from "@/lib/admin/clients";

function ClientDetailPageContent({ user: _user }: { user: AuthUser }) {
  const params = useParams();
  const router = useRouter();
  const id = parseSubmissionIdParam(params.id as string | string[] | undefined);
  const idValid = isSubmissionId(id);

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id === "pdf") {
      router.replace("/admin/clients");
    }
  }, [id, router]);

  const loadClient = useCallback(async () => {
    if (!idValid) {
      setLoading(false);
      setError(
        "This link is not a valid submission. Open a client from the list using the View button.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, adminFetchHeaders());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load client");
      setClient(data.client);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load client");
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [id, idValid]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const listItem: ClientListItem | null = client;

  const handleSaveEdit = async (payload: {
    email: string;
    phone: string;
    tax_identification_number: string;
    completed: boolean;
  }) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        ...adminFetchHeaders(),
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Update failed");
      setClient(data.client);
      setEditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        ...adminFetchHeaders(),
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Delete failed");
      router.push("/admin/clients");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-600"
          >
            <Icon name="chevron-left" className="size-4" />
            Back to client list
          </Link>
          {client && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p>{error}</p>
            {!idValid && (
              <p className="mt-2 text-xs text-red-600/80">
                URL must look like:{" "}
                <code className="rounded bg-red-100 px-1">
                  /admin/clients/b7a9c79e-5b2a-48e2-9173-b763a3101379
                </code>
              </p>
            )}
            <Link
              href="/admin/clients"
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              Go to client list →
            </Link>
          </div>
        )}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
          </div>
        ) : client ? (
          <ClientDetailView client={client} />
        ) : !error ? (
          <p className="text-center text-sm text-slate-400">Client not found in database.</p>
        ) : null}
      </div>

      <ClientEditModal
        open={editOpen}
        client={listItem}
        loading={editLoading}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete client?"
        message={
          client
            ? `Are you sure you want to permanently delete "${client.companyName}"? This cannot be undone.`
            : ""
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <AdminGate>
      {(user) => <ClientDetailPageContent user={user} />}
    </AdminGate>
  );
}
