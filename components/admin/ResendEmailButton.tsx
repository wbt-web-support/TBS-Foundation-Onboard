"use client";

import { useState } from "react";
import { adminFetchHeaders } from "@/components/admin/AdminGate";
import { Icon } from "@/components/ui/Icon";

export function ResendEmailButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${submissionId}/resend-email`, {
        ...adminFetchHeaders(),
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send email");
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
        <Icon name="check" className="size-4 shrink-0" />
        Email sent
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <Icon name="mail" className="size-4 shrink-0 text-slate-500" />
        {loading ? "Sending…" : "Re-send completion email"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
