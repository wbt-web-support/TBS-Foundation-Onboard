"use client";

import { useState, useCallback, useEffect } from "react";

type VideoItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  video_type: string;
};

const FEATURES = [
  {
    emoji: "✨",
    title: "AI Can Help",
    desc: "Start by writing your thoughts. The AI will help improve, expand, and structure them.",
  },
  {
    emoji: "⚙️",
    title: "Be Detailed",
    desc: "The more context you give, the smarter your AI becomes. Don't rush this.",
  },
  {
    emoji: "⚡",
    title: "Setup Time",
    desc: "This will take around 30 to 60 minutes. You can save your progress at any point.",
  },
];

function buildEmbedUrl(url: string, type: string): string {
  if (!url) return "";
  if (type === "vimeo") {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&autoplay=1` : "";
  }
  if (type === "youtube") {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : "";
  }
  if (type === "loom") {
    const id = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)?.[1];
    return id ? `https://www.loom.com/embed/${id}` : "";
  }
  return "";
}

export function WelcomeScreen({
  onStart,
  displayName,
  totalSteps,
}: {
  onStart: () => void;
  displayName?: string | null;
  totalSteps: number;
}) {
  const [openVideo, setOpenVideo] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    fetch("/api/welcome-videos")
      .then((r) => r.json())
      .then((d) => setVideos(d.videos ?? []))
      .catch(() => {});
  }, []);

  const closeVideo = useCallback(() => setOpenVideo(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeVideo(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeVideo]);

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] px-5 py-10 sm:px-8"
      style={{ background: "#0d0e10", color: "#f4f5f6" }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div
          className="rounded-2xl border p-7 sm:p-10"
          style={{ background: "#181a1d", borderColor: "#2a2c31" }}
        >
          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome{displayName ? (
              <>, <span style={{ color: "#14b8a6" }}>{displayName}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-2 text-lg font-medium tracking-wide" style={{ color: "#14b8a6" }}>
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-sm" style={{ color: "#9aa0a8" }}>Ready to get started</span>
          </div>

          {/* Lead text */}
          <p className="mt-5 max-w-3xl text-[15px] leading-relaxed" style={{ color: "#9aa0a8" }}>
            Let&apos;s set up your personalised workspace inside Command HQ. This is where your
            company&apos;s Digital Brain will live, and it&apos;s designed to become one of the most
            valuable tools in your business.
          </p>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed" style={{ color: "#9aa0a8" }}>
            Before you dive in, watch the short videos below — they explain how onboarding works and
            how to get the most out of it. The information you share in this questionnaire will be
            used to train your AI.
          </p>

          {/* Watch these first */}
          <p
            className="mt-8 text-xs font-bold uppercase tracking-widest"
            style={{ color: "#14b8a6" }}
          >
            ▶ Watch these first
          </p>

          {/* Video grid */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((v, i) => (
              <button
                key={i}
                onClick={() => setOpenVideo(i)}
                className="group overflow-hidden rounded-xl border text-left transition-transform hover:-translate-y-1"
                style={{ background: "#1f2125", borderColor: "#2a2c31" }}
              >
                <div
                  className="relative flex aspect-video items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#241712 0%,#2a1d28 60%,#14161b 100%)" }}
                >
                  <span
                    className="absolute left-2 top-2 grid size-[22px] place-items-center rounded-md text-xs font-bold text-white"
                    style={{ background: "rgba(0,0,0,.55)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="grid size-11 place-items-center rounded-full"
                    style={{ background: "rgba(20,184,166,.92)", boxShadow: "0 6px 20px rgba(20,184,166,.4)" }}
                  >
                    <span className="ml-1 inline-block" style={{ borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "14px solid #fff" }} />
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: "rgba(0,0,0,.7)" }}>
                    ▶ Watch
                  </span>
                </div>
                <div className="p-3 pb-4">
                  <p className="text-sm font-semibold leading-snug text-white">{v.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#9aa0a8" }}>{v.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Feature cards */}
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-xl border p-4"
                style={{ background: "#1f2125", borderColor: "#2a2c31" }}
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-lg text-lg"
                  style={{ background: "#14b8a6" }}
                >
                  {f.emoji}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "#9aa0a8" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="mt-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <button
                onClick={onStart}
                className="rounded-xl px-7 py-3.5 text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 active:scale-[.98]"
                style={{ background: "#14b8a6", border: "none" }}
              >
                Start Setup →
              </button>
              <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#9aa0a8" }}>
                🕐 Estimated time: 30–60 minutes
              </p>
            </div>

            {/* Step dots */}
            <div className="text-right">
              <p className="text-xs" style={{ color: "#9aa0a8" }}>
                Step 0 of {totalSteps}
              </p>
              <div className="mt-2 flex justify-end gap-1.5">
                {Array.from({ length: totalSteps + 1 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1 w-7 rounded-full"
                    style={{ background: i === 0 ? "#14b8a6" : "#2a2c31" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video modal */}
      {openVideo !== null && videos[openVideo] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)" }}
          onClick={closeVideo}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border"
            style={{ background: "#181a1d", borderColor: "#2a2c31" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#2a2c31" }}>
              <span className="font-semibold text-white">
                {openVideo + 1}. {videos[openVideo].title}
              </span>
              <button onClick={closeVideo} className="grid size-8 place-items-center rounded-lg border text-white hover:opacity-80" style={{ background: "#1f2125", borderColor: "#2a2c31" }}>
                ✕
              </button>
            </div>

            {buildEmbedUrl(videos[openVideo].url, videos[openVideo].video_type) ? (
              <div className="aspect-video">
                <iframe
                  src={buildEmbedUrl(videos[openVideo].url, videos[openVideo].video_type)}
                  title={videos[openVideo].title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-5 p-8 text-center" style={{ background: "linear-gradient(135deg,#241712 0%,#14161b 100%)" }}>
                <span className="grid size-16 place-items-center rounded-full" style={{ background: "rgba(20,184,166,.92)" }}>
                  <span className="ml-1.5 inline-block" style={{ borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid #fff" }} />
                </span>
                <p className="max-w-sm text-sm leading-relaxed" style={{ color: "#9aa0a8" }}>
                  Video coming soon — when a URL is added (Vimeo / YouTube / Loom), it will play here automatically.
                </p>
              </div>
            )}

            <div className="border-t px-5 py-3.5 text-xs" style={{ borderColor: "#2a2c31", color: "#9aa0a8" }}>
              {videos[openVideo].description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
