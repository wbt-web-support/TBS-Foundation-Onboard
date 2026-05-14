"use client";

import type { ReactNode } from "react";
import type { Question, QuestionRichSegment } from "@/lib/schema/types";
import { Icon } from "@/components/ui/Icon";
import { useOnboarding } from "./OnboardingContext";

function RichTitle({ segments }: { segments: QuestionRichSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 underline decoration-brand-600/80 underline-offset-2 hover:text-brand-700"
          >
            {seg.text}
          </a>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
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
    setAnswer(question.id, "");
    await flushSave();
    goNext();
  };

  return (
    <div
      id={`q-${question.id}`}
      className={`-mx-5 scroll-mt-8 px-5 sm:-mx-8 sm:px-8 ${invalid ? "rounded-card ring-2 ring-rose-400/80 ring-offset-2 ring-offset-slate-50" : ""}`}
    >
      <div
        className={`rounded-card border bg-white p-6 shadow-sm transition sm:p-8 ${
          invalid ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
        }`}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-xl font-semibold leading-snug text-ink sm:text-2xl">
              {question.titleRich?.length ? <RichTitle segments={question.titleRich} /> : question.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                required ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {required ? "Required" : "Optional"}
            </span>
          </div>
          {question.helper ? (
            <p className="text-sm leading-relaxed text-muted sm:text-[15px]">{question.helper}</p>
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
  children,
}: {
  question: Question;
  required: boolean;
  complete: boolean;
  invalid: boolean;
  children: ReactNode;
}) {
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
      className={`scroll-mt-8 rounded-card border bg-white p-6 shadow-sm transition ${
        invalid ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name={question.icon ?? "image"} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-ink">
            {question.titleRich?.length ? <RichTitle segments={question.titleRich} /> : question.title}
          </h3>
          {question.helper ? <p className="mt-1 text-sm text-muted">{question.helper}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            required ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>

      <div className="mt-4">{children}</div>

      <div className="mt-4 flex items-center gap-1.5 text-xs">
        <Icon name="check" className={`size-3.5 ${complete ? "text-emerald-600" : "text-slate-300"}`} />
        <span className={complete ? "font-medium text-emerald-600" : "text-slate-400"}>
          {complete ? "Completed" : required ? "Required" : "Optional"}
        </span>
        {invalid ? <span className="ml-2 text-rose-600">This field is required.</span> : null}
      </div>
    </div>
  );
}
