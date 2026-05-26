"use client";

import Image from "next/image";

import { ChoiceControlVisual } from "./ChoiceControlVisual";

export function OptionCard({
  label,
  imageUrl,
  linkUrl,
  description,
  example,
  warning,
  selected,
  onClick,
  control,
  tile,
}: {
  label: string;
  imageUrl?: string;
  linkUrl?: string;
  description?: string;
  example?: string;
  warning?: string;
  selected: boolean;
  onClick: () => void;
  control: "radio" | "checkbox";
  /** Force large image-tile layout (works for both radio and checkbox). */
  tile?: boolean;
}) {
  const tileMulti = (tile || control === "checkbox") && Boolean(imageUrl);
  const hasRichDetail = Boolean(description || example || warning);

  if (tileMulti) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        data-selected={selected ? "true" : "false"}
        role={control === "radio" ? "radio" : "checkbox"}
        aria-checked={selected}
        className={`group relative flex min-h-[9rem] w-full flex-col overflow-hidden rounded-lg border text-left text-sm transition sm:min-h-[10rem] ${
          selected
            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-700/20"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-600"
        }`}
      >
        <span className="absolute left-2.5 top-2.5 z-10">
          <ChoiceControlVisual variant={control === "radio" ? "radio" : "checkbox"} selected={selected} />
        </span>
        <div className="flex flex-1 items-center justify-center px-4 pb-1 pt-8">
          <Image
            src={imageUrl!}
            alt=""
            width={160}
            height={80}
            className="h-auto max-h-14 w-auto max-w-full object-contain sm:max-h-16"
            unoptimized
          />
        </div>
        <div className="border-t border-slate-100 bg-white px-2 py-2.5 text-center text-xs font-medium leading-snug text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {label}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      role={control === "radio" ? "radio" : "checkbox"}
      aria-checked={selected}
      className={`flex w-full rounded-lg border px-3.5 py-3 text-left text-sm transition ${
        imageUrl ? "flex-col gap-2" : hasRichDetail ? "flex-col items-stretch gap-0 py-3.5 sm:px-4 sm:py-4" : "items-center gap-3"
      } ${
        selected
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-700/20"
          : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-600"
      }`}
    >
      {imageUrl ? (
        <div className="relative flex h-14 w-full shrink-0 items-center justify-center rounded-md bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-600 dark:ring-slate-500">
          <Image
            src={imageUrl}
            alt=""
            width={120}
            height={48}
            className="max-h-12 w-auto max-w-[90%] object-contain"
            unoptimized
          />
        </div>
      ) : null}
      <div className={`flex min-w-0 flex-1 items-start gap-3 ${hasRichDetail ? "sm:gap-3.5" : ""}`}>
        <ChoiceControlVisual
          variant={control === "radio" ? "radio" : "checkbox"}
          selected={selected}
          className={hasRichDetail ? "mt-0.5" : ""}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={hasRichDetail ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}>{label}</span>
          {description ? (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
          {warning ? <p className="text-xs font-medium leading-snug text-rose-600 dark:text-rose-400">{warning}</p> : null}
          {example ? (
            <div className="rounded-md border border-slate-200/90 bg-slate-50 px-2.5 py-2 text-sm italic leading-relaxed text-slate-700 dark:border-slate-600/70 dark:bg-slate-600/50 dark:text-slate-300">
              {example}
            </div>
          ) : null}
          {linkUrl ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-xs font-medium text-brand-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Browse fonts at fonts.google.com
            </a>
          ) : null}
        </div>
      </div>
    </button>
  );
}
