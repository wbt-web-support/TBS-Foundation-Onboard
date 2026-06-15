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
    icon: "✨",
    title: "AI Can Help",
    desc: "Start by writing your thoughts. The AI will help improve, expand, and structure them.",
  },
  {
    icon: "⚙️",
    title: "Be Detailed",
    desc: "The more context you give, the smarter your AI becomes. Don't rush this.",
  },
  {
    icon: "⚡",
    title: "Setup Time",
    desc: "This takes around 30–60 minutes. You can save your progress at any point.",
  },
];

const WATCHED_KEY = "fo_watched_videos";

// Placeholder thumbnail gradients — each video gets a distinct WBT-tinted tile
// until real thumbnails/videos are added.
const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#042c37 0%,#1ca6a2 100%)",
  "linear-gradient(135deg,#063946 0%,#2f77c4 100%)",
  "linear-gradient(135deg,#042c37 0%,#f7630c 100%)",
  "linear-gradient(135deg,#063946 0%,#1f9d57 100%)",
];

function readWatched(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WATCHED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

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

type StepState = "complete" | "active" | "locked";

function StepBadge({ state, number }: { state: StepState; number: number }) {
  if (state === "complete") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange text-xs font-bold text-white">
        {number}
      </span>
    );
  }
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-b2 bg-surface text-xs font-bold text-dim">
      {number}
    </span>
  );
}

export function WelcomeScreen({
  onStart,
  displayName,
  totalSteps,
  questionnaireProgress = 0,
  questionnaireComplete = false,
}: {
  onStart: () => void;
  displayName?: string | null;
  totalSteps: number;
  questionnaireProgress?: number;
  questionnaireComplete?: boolean;
}) {
  const [openVideo, setOpenVideo] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [watched, setWatched] = useState<string[]>([]);

  useEffect(() => {
    setWatched(readWatched());
    fetch("/api/welcome-videos")
      .then((r) => r.json())
      .then((d) => setVideos(d.videos ?? []))
      .catch(() => {})
      .finally(() => setVideosLoading(false));
  }, []);

  const markWatched = useCallback((id: string) => {
    setWatched((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(WATCHED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openVideoAt = useCallback(
    (i: number) => {
      const v = videos[i];
      if (v) markWatched(v.id);
      setOpenVideo(i);
    },
    [videos, markWatched],
  );

  const closeVideo = useCallback(() => setOpenVideo(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeVideo(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeVideo]);

  // --- macro-step state ---------------------------------------------------
  const watchedCount = videos.filter((v) => watched.includes(v.id)).length;
  // Fail-open: if videos haven't loaded (e.g. backend hiccup) or there are none,
  // don't lock the user out of step 2. Only gate when videos actually exist.
  const videosComplete = !videosLoading && (videos.length === 0 || watchedCount >= videos.length);
  const questionnaireStarted = questionnaireProgress > 0;

  const step1: StepState = videosComplete ? "complete" : "active";
  const step2: StepState = questionnaireComplete ? "complete" : videosComplete ? "active" : "locked";
  const step3: StepState = questionnaireComplete ? "active" : "locked";
  const step4: StepState = "locked";

  const macroDone = [videosComplete, questionnaireComplete].filter(Boolean).length;
  const macroPercent = Math.round((macroDone / 4) * 100);

  const trackerNodes = [
    { label: "Welcome", state: step1 },
    { label: "Your details", state: step2 },
    { label: "Kickoff", state: step3 },
    { label: "All set", state: step4 },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-canvas px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">

        {/* Hero band */}
        <div className="rounded-lg bg-rail px-6 py-7 text-rail-text">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-rail-muted">
                Welcome{displayName ? `, ${displayName}` : ""}
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold leading-snug sm:text-3xl">
                {questionnaireComplete ? (
                  <>You&apos;re all set up. <br className="hidden sm:block" />Thank you!</>
                ) : (
                  <>Welcome to We Build Trades. <br className="hidden sm:block" />Let&apos;s get you set up.</>
                )}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-rail-muted">
                {questionnaireComplete
                  ? "We've got everything we need to get started. Your account manager will be in touch shortly to schedule your kickoff."
                  : "Four quick steps and your growth engine starts. It takes about 30–60 minutes. We save as you go, so you can stop and come back."}
              </p>
            </div>

            {/* Progress ring */}
            <div className="relative hidden size-16 shrink-0 place-items-center sm:grid">
              <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#f7630c" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(macroPercent / 100) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute text-sm font-bold text-rail-text">{macroPercent}%</span>
            </div>
          </div>

          {/* Compact tracker */}
          <div className="mt-5 flex items-center">
            {trackerNodes.map((node, i) => (
              <div key={node.label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                      node.state === "complete"
                        ? "bg-green text-white"
                        : node.state === "active"
                          ? "bg-orange text-white"
                          : "bg-rail-2 text-rail-muted"
                    }`}
                  >
                    {node.state === "complete" ? "✓" : i + 1}
                  </span>
                  <span className="text-[10px] font-medium text-rail-muted">{node.label}</span>
                </div>
                {i < trackerNodes.length - 1 && (
                  <span className={`mx-1 h-px flex-1 ${node.state === "complete" ? "bg-green/50" : "bg-rail-line"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-rail-muted">
            {macroDone} of 4 steps complete
          </p>
        </div>

        {/* STEP 1 — Welcome videos */}
        <div className="mt-4 rounded-lg border border-b1 bg-panel shadow-card">
          <div className="flex items-center justify-between border-b border-b1 px-5 py-4">
            <div className="flex items-center gap-3">
              <StepBadge state={step1} number={1} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-mid">Step 1 of 4</p>
                <h2 className="mt-0.5 font-display text-base font-semibold text-ink">Welcome videos</h2>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                videosComplete ? "bg-green-tint text-green" : "bg-orange-tint text-orange"
              }`}
            >
              {videosComplete ? "Complete" : "In progress"}
            </span>
          </div>

          <p className="px-5 py-3 text-sm text-mid">
            Watch these short videos to understand how onboarding works. We&apos;ll tick them off as you watch.
          </p>

          <div className="divide-y divide-b1">
            {videos.map((v, i) => {
              const isWatched = watched.includes(v.id);
              return (
                <button
                  key={v.id ?? i}
                  onClick={() => openVideoAt(i)}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-surface"
                >
                  <div
                    className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md"
                    style={{ background: THUMB_GRADIENTS[i % THUMB_GRADIENTS.length] }}
                  >
                    {/* subtle sheen */}
                    <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 80% at 30% 0%, rgba(255,255,255,0.18), transparent 60%)" }} />
                    {/* index badge */}
                    <span className="absolute left-1 top-1 grid size-4 place-items-center rounded text-[9px] font-bold text-white" style={{ background: "rgba(0,0,0,0.4)" }}>
                      {i + 1}
                    </span>
                    {/* play button */}
                    <span className="relative grid size-7 place-items-center rounded-full" style={{ background: "rgba(247,99,12,0.95)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                      <span className="ml-0.5 inline-block" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #fff" }} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{v.title}</p>
                    <p className="mt-0.5 text-xs text-dim">{v.description}</p>
                  </div>
                  {isWatched ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Watched
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-teal">▶ Tap to play</span>
                  )}
                </button>
              );
            })}
            {videosLoading && (
              <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-dim">
                <span className="size-4 animate-spin rounded-full border-2 border-b1 border-t-orange" />
                Loading videos…
              </div>
            )}
            {!videosLoading && videos.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-dim">No videos available yet.</div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-b1 px-5 py-3 text-xs text-dim">
            <span>{watchedCount} of {videos.length} watched</span>
            <span>About 10 minutes of video in total</span>
          </div>
        </div>

        {/* STEP 2 — Onboarding questionnaire */}
        <button
          type="button"
          disabled={step2 === "locked"}
          onClick={onStart}
          className={`group mt-4 block w-full rounded-lg border bg-panel text-left shadow-card transition ${
            step2 === "locked"
              ? "cursor-not-allowed border-b1 opacity-60"
              : "border-b1 hover:border-orange/40 hover:shadow-lift"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <StepBadge state={step2} number={2} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-mid">Step 2 of 4</p>
                <h2 className="mt-0.5 font-display text-base font-semibold text-ink">Onboarding questionnaire</h2>
              </div>
            </div>
            {step2 === "locked" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-dim">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  questionnaireComplete ? "bg-green-tint text-green" : "bg-orange-tint text-orange"
                }`}
              >
                {questionnaireComplete ? "Complete" : questionnaireStarted ? "In progress" : "Ready"}
              </span>
            )}
          </div>

          <div className="border-t border-b1 px-5 py-3">
            <p className="text-sm text-mid">
              {step2 === "locked"
                ? "Unlocks after you watch the welcome videos above."
                : questionnaireComplete
                  ? "All sections complete. Tap to review or edit any of your answers."
                  : `${totalSteps} sections about your company, branding, ads and account access. We save as you go.`}
            </p>
            {step2 !== "locked" && (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-b1">
                  <div
                    className={`h-full rounded-full transition-all ${questionnaireComplete ? "bg-green" : "bg-orange"}`}
                    style={{ width: `${questionnaireComplete ? 100 : questionnaireProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-mid tabular-nums">
                  {questionnaireComplete ? 100 : questionnaireProgress}%
                </span>
                <span className="text-sm font-semibold text-orange transition group-hover:translate-x-0.5">
                  {questionnaireComplete ? "Review →" : questionnaireStarted ? "Continue →" : "Start →"}
                </span>
              </div>
            )}
          </div>
        </button>

        {/* STEP 3 + 4 — locked / coming soon */}
        {[
          { n: 3, title: "Schedule your kickoff", desc: "Book your kickoff call with your account manager.", state: step3 },
          { n: 4, title: "Your portal is unlocked", desc: "Your leads, project and AI assistant, all in one place.", state: step4 },
        ].map((s) => (
          <div
            key={s.n}
            className={`mt-4 flex items-center justify-between rounded-lg border border-b1 bg-panel px-5 py-4 shadow-card ${
              s.state === "locked" ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <StepBadge state={s.state} number={s.n} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-mid">Step {s.n} of 4</p>
                <h2 className="mt-0.5 font-display text-base font-semibold text-ink">{s.title}</h2>
                <p className="mt-0.5 text-xs text-dim">{s.desc}</p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-dim">
              {s.state === "active" ? "Coming soon" : "Locked"}
            </span>
          </div>
        ))}

        {/* Feature chips */}
        {!questionnaireComplete && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-lg border border-b1 bg-panel p-4 shadow-card">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-tint text-lg">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-ink">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mid">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Primary CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {step2 === "locked" ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md bg-b2 px-6 py-2.5 text-[14px] font-semibold text-dim"
            >
              Watch the videos to continue
            </button>
          ) : (
            <button
              onClick={onStart}
              className="rounded-md bg-orange px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#e25608] active:scale-[.98]"
            >
              {questionnaireComplete ? "Review your answers" : questionnaireStarted ? "Continue Onboarding →" : "Start Onboarding →"}
            </button>
          )}
          {!questionnaireComplete && (
            <p className="flex items-center gap-1.5 text-sm text-mid">
              <span>🕐</span> Estimated time: 30–60 minutes
            </p>
          )}
        </div>

        <p className="mt-6 pb-8 text-center text-xs text-dim">
          Answers are auto-saved in real time. You can stop and resume at any time.
        </p>
      </div>

      {/* Video modal */}
      {openVideo !== null && videos[openVideo] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(4,44,55,.8)", backdropFilter: "blur(4px)" }}
          onClick={closeVideo}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-lg border border-b1 bg-panel shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-b1 px-5 py-4">
              <span className="font-display text-sm font-semibold text-ink">
                {openVideo + 1}. {videos[openVideo].title}
              </span>
              <button
                onClick={closeVideo}
                className="grid size-8 place-items-center rounded-lg border border-b2 bg-surface text-mid hover:border-b3 hover:text-ink"
              >
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
              <div
                className="flex aspect-video flex-col items-center justify-center gap-5 p-8 text-center"
                style={{ background: "linear-gradient(135deg, #042c37 0%, #063946 100%)" }}
              >
                <span className="grid size-16 place-items-center rounded-full" style={{ background: "rgba(247,99,12,.9)" }}>
                  <span className="ml-1.5 inline-block" style={{ borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid #fff" }} />
                </span>
                <p className="max-w-sm text-sm leading-relaxed text-rail-muted">
                  Video coming soon — a URL will be added shortly and it will play here automatically.
                </p>
              </div>
            )}

            <div className="border-t border-b1 px-5 py-3.5 text-xs text-dim">
              {videos[openVideo].description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
