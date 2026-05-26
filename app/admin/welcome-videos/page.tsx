"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";

type Video = {
  id: string;
  title: string;
  description: string;
  url: string;
  video_type: string;
  sort_order: number;
  active: boolean;
};

const EMPTY: Omit<Video, "id" | "sort_order"> = {
  title: "",
  description: "",
  url: "",
  video_type: "custom",
  active: true,
};

const VIDEO_TYPES = ["custom", "vimeo", "youtube", "loom"];

export default function WelcomeVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<Video, "id" | "sort_order">>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/welcome-videos", { credentials: "include" });
    const data = await res.json();
    setVideos(data.videos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openNew() {
    setForm(EMPTY);
    setEditingId("new");
    setError(null);
  }

  function openEdit(v: Video) {
    setForm({ title: v.title, description: v.description, url: v.url, video_type: v.video_type, active: v.active });
    setEditingId(v.id);
    setError(null);
  }

  function cancelEdit() { setEditingId(null); setError(null); }

  async function saveVideo() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/admin/welcome-videos" : `/api/admin/welcome-videos/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        },
      );
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(v: Video) {
    await fetch(`/api/admin/welcome-videos/${v.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !v.active }),
    });
    await load();
  }

  async function deleteVideo(v: Video) {
    if (!confirm(`Delete "${v.title}"?`)) return;
    await fetch(`/api/admin/welcome-videos/${v.id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  async function move(v: Video, dir: -1 | 1) {
    const idx = videos.findIndex((x) => x.id === v.id);
    const swap = videos[idx + dir];
    if (!swap) return;
    await Promise.all([
      fetch(`/api/admin/welcome-videos/${v.id}`,    { method: "PATCH", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ sort_order: swap.sort_order }) }),
      fetch(`/api/admin/welcome-videos/${swap.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ sort_order: v.sort_order }) }),
    ]);
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome Screen Videos</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage the videos shown on the onboarding welcome page.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Icon name="plus" className="size-4" /> Add Video
        </button>
      </div>

      {/* Add / Edit form */}
      {editingId !== null && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800/40 dark:bg-brand-900/20">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {editingId === "new" ? "Add new video" : "Edit video"}
          </h2>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Title *</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Welcome to Command HQ"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Description</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown below the video title"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Video URL</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://vimeo.com/… or YouTube / Loom"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Type</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={form.video_type}
                  onChange={(e) => setForm((f) => ({ ...f, video_type: e.target.value }))}
                >
                  {VIDEO_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded"
              />
              Show on welcome screen
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveVideo}
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Video list */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-slate-500">No videos yet. Click "Add Video" to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map((v, idx) => (
            <div
              key={v.id}
              className={`flex items-start gap-4 rounded-xl border p-4 ${
                v.active
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-dashed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/50"
              }`}
            >
              {/* Order controls */}
              <div className="flex flex-col gap-1 pt-0.5">
                <button
                  onClick={() => move(v, -1)}
                  disabled={idx === 0}
                  className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
                >
                  ▲
                </button>
                <span className="text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                <button
                  onClick={() => move(v, 1)}
                  disabled={idx === videos.length - 1}
                  className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
                >
                  ▼
                </button>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{v.title}</p>
                {v.description && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{v.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {v.video_type}
                  </span>
                  {v.url ? (
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[260px] truncate text-xs text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {v.url}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No URL — placeholder shown</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => toggleActive(v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    v.active
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {v.active ? "Visible" : "Hidden"}
                </button>
                <button
                  onClick={() => openEdit(v)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteVideo(v)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
