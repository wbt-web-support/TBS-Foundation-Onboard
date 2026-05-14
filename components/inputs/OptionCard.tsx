"use client";

import Image from "next/image";

import { Icon } from "@/components/ui/Icon";

export function OptionCard({
  label,
  imageUrl,
  linkUrl,
  selected,
  onClick,
  control,
}: {
  label: string;
  imageUrl?: string;
  linkUrl?: string;
  selected: boolean;
  onClick: () => void;
  control: "radio" | "checkbox";
}) {
  const tileMulti = control === "checkbox" && Boolean(imageUrl);

  if (tileMulti) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-selected={selected ? "true" : "false"}
        aria-pressed={selected}
        className={`group relative flex w-full flex-col overflow-hidden rounded-lg border text-left text-sm transition ${
          selected
            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        <span className="sr-only">{label}</span>
        <div className="relative flex h-[4.5rem] w-full shrink-0 items-center justify-center bg-slate-50 ring-1 ring-slate-100 sm:h-[5.25rem]">
          <Image
            src={imageUrl!}
            alt=""
            width={120}
            height={48}
            className="max-h-10 w-auto max-w-[72%] object-contain sm:max-h-12"
            unoptimized
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[var(--color-intro-card)]/95 px-2 py-1.5 text-center text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[selected=true]:opacity-100 [@media(hover:none)]:opacity-100 sm:text-xs"
          >
            <span className="line-clamp-2">{label}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={control === "checkbox" ? selected : undefined}
      className={`flex w-full rounded-lg border px-3.5 py-3 text-left text-sm transition ${
        imageUrl ? "flex-col gap-2" : "items-center gap-3"
      } ${
        selected
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
          : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      {imageUrl ? (
        <div className="relative flex h-14 w-full shrink-0 items-center justify-center rounded-md bg-slate-50 ring-1 ring-slate-100">
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
      <div className={`flex min-w-0 flex-1 items-start gap-3`}>
        <span
          className={`grid size-5 shrink-0 place-items-center border ${
            control === "radio" ? "rounded-full" : "rounded"
          } ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-transparent"}`}
        >
          {control === "radio" ? (
            <span className={`size-2 rounded-full ${selected ? "bg-white" : "bg-transparent"}`} />
          ) : (
            <Icon name="check" className="size-3.5" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-slate-700">{label}</span>
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
