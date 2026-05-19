"use client";

import { useEffect, useState } from "react";
import type { ClientListItem } from "@/lib/admin/clients";

type ClientEditModalProps = {
  open: boolean;
  client: ClientListItem | null;
  loading: boolean;
  onClose: () => void;
  onSave: (payload: {
    email: string;
    phone: string;
    tax_identification_number: string;
    completed: boolean;
  }) => void;
};

export function ClientEditModal({
  open,
  client,
  loading,
  onClose,
  onSave,
}: ClientEditModalProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!client) return;
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setTaxId(client.taxId ?? "");
    setCompleted(client.completed);
  }, [client]);

  if (!open || !client) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">Edit client</h2>
        <p className="mt-1 text-sm text-slate-500">{client.companyName}</p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              email,
              phone,
              tax_identification_number: taxId,
              completed,
            });
          }}
        >
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Tax ID</span>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-700">Mark as completed</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
