"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Question, QuestionRichSegment } from "@/lib/schema/types";
import { provideLaterAnswerValue } from "@/lib/provideLater";
import { Icon } from "@/components/ui/Icon";
import { useOnboarding } from "./OnboardingContext";

/** Turn a Loom share URL into an embed URL (preserves query e.g. `?t=12`). */
function loomShareToEmbedUrl(shareUrl: string): string | null {
  try {
    const u = new URL(shareUrl);
    if (!u.hostname.endsWith("loom.com")) return null;
    const m = u.pathname.match(/\/share\/([^/]+)/);
    if (!m) return null;
    return `https://www.loom.com/embed/${m[1]}${u.search}`;
  } catch {
    return null;
  }
}

const LINK_CLASS =
  "font-medium text-brand-600 underline decoration-brand-600/80 underline-offset-2 hover:text-brand-700";

function RichTitle({ segments }: { segments: QuestionRichSegment[] }) {
  const [loomEmbedUrl, setLoomEmbedUrl] = useState<string | null>(null);

  const closeModal = useCallback(() => setLoomEmbedUrl(null), []);

  useEffect(() => {
    if (!loomEmbedUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [loomEmbedUrl, closeModal]);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type !== "link") {
          return <span key={i}>{seg.text}</span>;
        }
        const embed = seg.openInModal ? loomShareToEmbedUrl(seg.href) : null;
        if (seg.openInModal && embed) {
          return (
            <button
              key={i}
              type="button"
              className={`${LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 text-left`}
              onClick={() => setLoomEmbedUrl(embed)}
            >
              {seg.text}
            </button>
          );
        }
        return (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            {seg.text}
          </a>
        );
      })}
      {loomEmbedUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Video"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-slate-900 shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <span className="text-lg leading-none" aria-hidden>
                ×
              </span>
            </button>
            <div className="aspect-video w-full max-h-[min(80vh,720px)]">
              <iframe
                title="Loom video"
                src={loomEmbedUrl}
                className="size-full border-0"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function GoogleSheetDarkCard({
  question,
  required,
  complete,
  invalid,
  children,
}: {
  question: Question;
  required: boolean;
  complete: boolean;
  invalid: boolean;
  children: ReactNode;
}) {
  const { setAnswer, goNext, flushSave } = useOnboarding();
  const r = question.googleSheetResources;
  if (!r) return null;

  const onProvideLater = async () => {
    setAnswer(question.id, provideLaterAnswerValue(question));
    await flushSave();
    goNext();
  };

  return (
    <div
      id={`q-${question.id}`}
      className={`-mx-5 scroll-mt-8 px-5 sm:-mx-8 sm:px-8 ${invalid ? "rounded-card ring-2 ring-rose-400/80 ring-offset-2 ring-offset-slate-50" : ""}`}
    >
      <div
        className={`rounded-card border bg-white p-6 shadow-sm transition dark:bg-slate-800 sm:p-8 ${
          invalid ? "border-rose-300 ring-1 ring-rose-200 dark:border-rose-500/60" : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-xl font-semibold leading-snug text-ink sm:text-2xl">
              {question.titleRich?.length ? <RichTitle segments={question.titleRich} /> : question.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                required ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {required ? "Required" : "Optional"}
            </span>
          </div>
          {question.helper ? (
            <p className="text-sm leading-relaxed text-muted whitespace-pre-line sm:text-[15px]">{question.helper}</p>
          ) : null}
          <div className="flex flex-col items-center gap-3">
            <a
              href={r.tutorialVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-xl text-center text-sm font-medium text-[var(--color-intro-cta)] underline decoration-[var(--color-intro-cta)] underline-offset-2 transition hover:text-[var(--color-intro-cta-hover)]"
            >
              {r.tutorialLinkLabel ??
                "Click here to watch a video tutorial on how to add a product to the sheet."}
            </a>
            <a
              href={r.templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <Icon name="sheet" className="size-4 shrink-0 text-brand-600" />
              {r.productSheetButtonLabel ?? "Product Sheet"}
            </a>
          </div>
          <div className="w-full">{children}</div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void onProvideLater()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Icon name="clock" className="size-4 shrink-0 text-slate-500" />
              I will provide later
              <Icon name="chevron-right" className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 border-t border-slate-200 pt-4 text-xs">
            <Icon name="check" className={`size-3.5 ${complete ? "text-emerald-600" : "text-slate-300"}`} />
            <span className={complete ? "font-medium text-emerald-600" : "text-slate-400"}>
              {complete ? "Completed" : required ? "Required" : "Optional"}
            </span>
            {invalid ? <span className="ml-2 text-rose-600">This field is required.</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuestionCard({
  question,
  required,
  complete,
  invalid,
  invalidMessage,
  children,
}: {
  question: Question;
  required: boolean;
  complete: boolean;
  invalid: boolean;
  invalidMessage?: string;
  children: ReactNode;
}) {
  const { setAnswer, goNext, flushSave } = useOnboarding();

  const onProvideLaterSkip = async () => {
    setAnswer(question.id, provideLaterAnswerValue(question));
    await flushSave();
    goNext();
  };

  if (question.presentation === "google-sheet-dark" && question.googleSheetResources) {
    return (
      <GoogleSheetDarkCard question={question} required={required} complete={complete} invalid={invalid}>
        {children}
      </GoogleSheetDarkCard>
    );
  }

  return (
    <div
      id={`q-${question.id}`}
      className={`scroll-mt-8 rounded-card border bg-white p-4 shadow-sm transition dark:bg-slate-800 sm:p-6 ${
        invalid ? "border-rose-300 ring-1 ring-rose-200 dark:border-rose-500/60" : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 sm:size-9">
          <Icon name={question.icon ?? "image"} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-ink sm:text-base">
            {question.titleRich?.length ? <RichTitle segments={question.titleRich} /> : question.title}
          </h3>
          {question.helperRich?.length ? (
            <div className="mt-1 text-sm leading-relaxed text-muted">
              <RichTitle segments={question.helperRich} />
            </div>
          ) : question.helper ? (
            <p className="mt-1 text-sm text-muted whitespace-pre-line">{question.helper}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            required ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>

      {question.cardImageUrl ? (
        <div className="mt-4 flex justify-center rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
          <Image
            src={question.cardImageUrl}
            alt={question.cardImageAlt ?? ""}
            width={640}
            height={480}
            className="h-auto max-h-40 w-full max-w-2xl object-contain"
            sizes="(max-width: 768px) 100vw, 42rem"
          />
        </div>
      ) : null}

      <div className="mt-4">{children}</div>

      {question.provideLater ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void onProvideLaterSkip()}
            className={
              question.provideLater.variant === "dark"
                ? "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                : "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white bg-[var(--color-intro-cta)] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--color-intro-cta-hover)]"
            }
          >
            {question.provideLater.variant !== "dark" ? (
              <Icon name="clock" className="size-4 shrink-0 opacity-90" />
            ) : null}
            {question.provideLater.label ?? "I will provide later"}
            <Icon
              name="chevron-right"
              className={`size-4 shrink-0 ${question.provideLater.variant === "dark" ? "text-white" : ""}`}
            />
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-1.5 text-xs">
        <Icon name="check" className={`size-3.5 ${complete ? "text-emerald-600" : "text-slate-300"}`} />
        <span className={complete ? "font-medium text-emerald-600" : "text-slate-400"}>
          {complete ? "Completed" : required ? "Required" : "Optional"}
        </span>
        {invalid ? (
          <span className="ml-2 text-rose-600">{invalidMessage ?? "This field is required."}</span>
        ) : null}
      </div>
    </div>
  );
}
