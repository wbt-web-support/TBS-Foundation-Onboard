"use client";

import { useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";

export function AdminNotesPanel({
  submissionId,
  initialNotes,
}: {
  submissionId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${submissionId}`, {
        ...adminFetchHeaders(),
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-700">Admin notes</h2>
        <p className="mt-0.5 text-xs text-slate-500">Private — not visible to the client</p>
      </div>
      <div className="p-6 space-y-3">
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          rows={4}
          placeholder="Add internal notes about this client…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-y"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
          {saved && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </section>
  );
}
