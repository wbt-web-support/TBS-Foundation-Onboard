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
  "font-medium text-teal underline decoration-teal/80 underline-offset-2 hover:text-[#178f8b]";

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
      className={`-mx-5 scroll-mt-8 px-5 sm:-mx-8 sm:px-8 ${invalid ? "rounded-lg ring-2 ring-red/40 ring-offset-2 ring-offset-canvas" : ""}`}
    >
      <div
        className={`rounded-lg border bg-panel p-6 shadow-card transition sm:p-8 ${
          invalid ? "border-red/40" : "border-b1"
        }`}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-xl font-semibold leading-snug text-ink sm:text-2xl">
              {question.titleRich?.length ? <RichTitle segments={question.titleRich} /> : question.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                required ? "bg-amber-tint text-yellow" : "bg-surface text-mid"
              }`}
            >
              {required ? "Required" : "Optional"}
            </span>
          </div>
          {question.helper ? (
            <p className="text-sm leading-relaxed text-mid whitespace-pre-line sm:text-[15px]">{question.helper}</p>
          ) : null}
          <div className="flex flex-col items-center gap-3">
            <a
              href={r.tutorialVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-xl text-center text-sm font-medium text-teal underline decoration-teal/80 underline-offset-2 transition hover:text-[#178f8b]"
            >
              {r.tutorialLinkLabel ??
                "Click here to watch a video tutorial on how to add a product to the sheet."}
            </a>
            <a
              href={r.templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-b2 bg-panel px-5 py-2.5 text-sm font-medium text-ink transition hover:border-b3 hover:bg-surface"
            >
              <Icon name="sheet" className="size-4 shrink-0 text-teal" />
              {r.productSheetButtonLabel ?? "Product Sheet"}
            </a>
          </div>
          <div className="w-full">{children}</div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void onProvideLater()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-b2 bg-panel px-5 py-2.5 text-sm font-medium text-mid transition hover:border-b3 hover:text-ink"
            >
              <Icon name="clock" className="size-4 shrink-0 text-dim" />
              I will provide later
              <Icon name="chevron-right" className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 border-t border-b1 pt-4 text-xs">
            <Icon name="check" className={`size-3.5 ${complete ? "text-green" : "text-b3"}`} />
            <span className={complete ? "font-medium text-green" : "text-dim"}>
              {complete ? "Completed" : required ? "Required" : "Optional"}
            </span>
            {invalid ? <span className="ml-2 text-red">This field is required.</span> : null}
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
      className={`scroll-mt-8 rounded-lg border bg-panel p-4 shadow-card transition sm:p-6 ${
        invalid ? "border-red/40 ring-1 ring-red/20" : "border-b1"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-tint text-teal sm:size-9">
          <Icon name={question.icon ?? "image"} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-ink sm:text-base">
            {question.titleRich?.length ? <RichTitle segments={question.titleRich} /> : question.title}
          </h3>
          {question.helperRich?.length ? (
            <div className="mt-1 text-sm leading-relaxed text-mid">
              <RichTitle segments={question.helperRich} />
            </div>
          ) : question.helper ? (
            <p className="mt-1 text-sm text-mid whitespace-pre-line">{question.helper}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            required ? "bg-amber-tint text-yellow" : "bg-surface text-mid"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>

      {question.cardImageUrl ? (
        <div className="mt-4 flex justify-center rounded-lg border border-b1 bg-surface px-4 py-3">
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
                ? "inline-flex items-center justify-center gap-2 rounded-md border border-b2 bg-rail px-6 py-2.5 text-sm font-semibold text-rail-text shadow-card transition hover:bg-rail-2"
                : "inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-[#e25608]"
            }
          >
            {question.provideLater.variant !== "dark" ? (
              <Icon name="clock" className="size-4 shrink-0 opacity-90" />
            ) : null}
            {question.provideLater.label ?? "I will provide later"}
            <Icon name="chevron-right" className="size-4 shrink-0" />
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-1.5 text-xs">
        <Icon name="check" className={`size-3.5 ${complete ? "text-green" : "text-b3"}`} />
        <span className={complete ? "font-medium text-green" : "text-dim"}>
          {complete ? "Completed" : required ? "Required" : "Optional"}
        </span>
        {invalid ? (
          <span className="ml-2 text-red">{invalidMessage ?? "This field is required."}</span>
        ) : null}
      </div>
    </div>
  );
}
