"use client";

import { useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";
import { Icon } from "@/components/ui/Icon";

export function SendReminderButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${submissionId}/send-reminder`, {
        ...adminFetchHeaders(),
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send reminder");
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <Icon name="check" className="size-3.5 shrink-0" />
        Reminder sent
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
      >
        <Icon name="mail" className="size-3.5 shrink-0" />
        {loading ? "Sending…" : "Remind"}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </span>
  );
}
