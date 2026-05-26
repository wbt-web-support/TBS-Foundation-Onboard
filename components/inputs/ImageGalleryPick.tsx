"use client";

import { useState } from "react";
import Link from "next/link";
import type { GalleryOption } from "@/lib/schema/types";
import { TEMPLATE_UPLOAD_OWN_ID } from "@/lib/schema/templateGalleries";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { ImageUpload } from "./ImageUpload";
import { ChoiceControlVisual } from "./ChoiceControlVisual";
import { Icon } from "@/components/ui/Icon";

export type GalleryUploadOwnConfig = {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  maxSizeMB?: number;
};

type ButtonShape = NonNullable<GalleryOption["buttonShape"]>;
type GallerySurface = "light" | "dark";

function shapeRadiusClass(shape: ButtonShape): string {
  if (shape === "sharp" || shape === "skew") return "rounded-none";
  if (shape === "pill") return "rounded-full";
  return "rounded-[6px]";
}

function tileChromeClass(
  surface: GallerySurface,
  selected: boolean,
  isButtonStyleGallery: boolean,
  isButtonPreview: boolean,
): string {
  if (surface === "light") {
    if (isButtonStyleGallery && isButtonPreview) {
      return selected
        ? "border-brand-500 bg-slate-900 ring-1 ring-brand-500"
        : "border-slate-300 bg-slate-900 hover:border-slate-400";
    }
    return selected
      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
      : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50";
  }
  if (isButtonStyleGallery && isButtonPreview) {
    return selected
      ? "border-brand-500 bg-[var(--color-intro-card)] ring-1 ring-brand-500"
      : "border-slate-600/90 bg-[var(--color-intro-card)] hover:border-slate-500";
  }
  return selected
    ? "border-brand-500 bg-[var(--color-intro-card)] ring-1 ring-brand-500"
    : "border-white/20 bg-white/5 hover:border-white/35";
}

function GalleryTileImage({ imageUrl, label }: { imageUrl?: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !imageUrl || failed;

  return (
    <div className="flex flex-1 items-center justify-center px-3 pb-1 pt-8">
      {showPlaceholder ? (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Icon name="image" className="size-8 text-slate-300" />
          {failed && imageUrl ? (
            <span className="max-w-full px-1 text-[10px] text-slate-400">Image unavailable</span>
          ) : null}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={label}
          className="max-h-12 w-auto max-w-[78%] object-contain sm:max-h-14"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function TemplateGalleryTile({
  imageUrl,
  previewUrl,
  label,
  enableZoom,
  onZoom,
}: {
  imageUrl?: string;
  previewUrl?: string;
  label: string;
  enableZoom: boolean;
  onZoom: (src: string, alt: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !imageUrl || failed;
  const zoomSrc = previewUrl || imageUrl;

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
      {showPlaceholder ? (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2 text-center">
          <Icon name="image" className="size-10 text-slate-300" />
          {failed && imageUrl ? (
            <span className="text-[10px] text-slate-400">Image unavailable</span>
          ) : null}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={label}
          className={`h-full w-full object-cover object-top ${enableZoom ? "cursor-zoom-in" : ""}`}
          onError={() => setFailed(true)}
          onClick={
            enableZoom && zoomSrc
              ? (e) => {
                  e.stopPropagation();
                  onZoom(zoomSrc, label);
                }
              : undefined
          }
        />
      )}
      {enableZoom && zoomSrc && !showPlaceholder ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom(zoomSrc, label);
          }}
          className="absolute right-2 top-2 z-20 grid size-9 place-items-center rounded-full bg-slate-900/85 text-white shadow-md ring-1 ring-white/20 transition hover:bg-slate-900 hover:ring-white/40"
          aria-label={`Preview ${label} in full size`}
        >
          <Icon name="zoom-in" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function ButtonStylePreviewPair({
  shape,
  sampleText,
}: {
  shape: ButtonShape;
  sampleText: string;
}) {
  const motionCls =
    "transition-shadow duration-200 motion-reduce:transition-none group-hover:shadow-md";

  if (shape === "skew") {
    const chipShell =
      `box-border inline-flex w-full min-w-0 -skew-x-[16deg] items-center justify-center rounded-none border-2 border-[var(--color-intro-cta)] px-2 py-1.5 sm:px-2.5 sm:py-2 ${motionCls}`;
    const chipLabel =
      "inline-block skew-x-[16deg] text-center text-[8px] font-bold uppercase leading-tight tracking-wide sm:text-[9px]";

    const SkewButton = ({ className }: { className: string }) => (
      <div className="flex min-w-0 items-stretch justify-center overflow-visible px-1 sm:px-1.5">
        <span className={`${chipShell} ${className}`}>
          <span className={chipLabel}>{sampleText}</span>
        </span>
      </div>
    );

    return (
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-2.5">
        <SkewButton className="bg-[var(--color-intro-cta)] text-white group-hover:brightness-105" />
        <SkewButton className="bg-white text-[var(--color-intro-cta)]" />
      </div>
    );
  }

  const base =
    `box-border flex w-full min-w-0 max-w-full items-center justify-center border-2 border-[var(--color-intro-cta)] px-1.5 py-1.5 text-center text-[8px] font-bold uppercase leading-tight tracking-wide sm:px-2 sm:py-2 sm:text-[9px] ${motionCls} ` +
    shapeRadiusClass(shape);

  const filled = `${base} bg-[var(--color-intro-cta)] text-white group-hover:brightness-105`;
  const outline = `${base} bg-white text-[var(--color-intro-cta)]`;

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-1.5 sm:gap-2">
      <div className="flex min-w-0 items-center justify-center overflow-hidden">
        <span className={filled}>{sampleText}</span>
      </div>
      <div className="flex min-w-0 items-center justify-center overflow-hidden">
        <span className={outline}>{sampleText}</span>
      </div>
    </div>
  );
}

export function ImageGalleryPick({
  options,
  value,
  onChange,
  multiple = false,
  surface = "light",
  layout = "compact",
  enableZoom = false,
  allowUploadOwn = false,
  uploadOwn,
  galleryType,
}: {
  options: GalleryOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  /** `light` for white question cards; `dark` for intro / dark panels. */
  surface?: GallerySurface;
  /** `template` — full mockup thumbnails (Real / Animated / Mixed pickers). */
  layout?: "compact" | "template";
  enableZoom?: boolean;
  /** Adds "Upload my own" tile + action (template galleries). */
  allowUploadOwn?: boolean;
  /** When set, the upload control is rendered inside the "Upload my own" card. */
  uploadOwn?: GalleryUploadOwnConfig;
  /** Template gallery type — enables the Customize button on template tiles. */
  galleryType?: "real" | "animated" | "mixed";
}) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const isButtonStyleGallery = options.some((o) => Boolean(o.buttonShape));
  const controlVariant = multiple ? ("checkbox" as const) : ("radio" as const);
  const isLight = surface === "light";
  const isTemplateLayout = layout === "template";
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);

  const selectUploadOwn = () => onChange(TEMPLATE_UPLOAD_OWN_ID);

  const handleUploadOwnChange = (url: string) => {
    uploadOwn?.onChange(url);
    if (url) selectUploadOwn();
  };

  return (
    <>
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      role={multiple ? "group" : "radiogroup"}
    >
      {options.map((o) => {
        const selected = selectedValues.includes(o.id);
        const swatches = o.swatchColors?.filter(Boolean) ?? [];
        const isSwatchTile = swatches.length > 0;
        const buttonShape = o.buttonShape;
        const isButtonPreview = Boolean(buttonShape);
        const sampleLabel = o.label.toUpperCase();
        const toggle = () => {
          if (multiple) {
            onChange(selected ? selectedValues.filter((id) => id !== o.id) : [...selectedValues, o.id]);
          } else {
            onChange(selected ? "" : o.id);
          }
        };

        const tileChrome = tileChromeClass(surface, selected, isButtonStyleGallery, isButtonPreview);
        const controlSurface = isLight && !isButtonPreview ? "default" : "inverse";

        if (isTemplateLayout) {
          const isUploadOwnTile = allowUploadOwn && o.id === TEMPLATE_UPLOAD_OWN_ID;

          if (isUploadOwnTile) {
            return (
              <div
                key={o.id}
                data-selected={selected ? "true" : "false"}
                className={`group relative overflow-hidden rounded-xl border text-left transition ${
                  selected
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                    : "border-dashed border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/50"
                }`}
              >
                <div
                  className="flex aspect-[4/5] min-h-0 flex-col bg-slate-50 p-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {uploadOwn ? (
                    <ImageUpload
                      questionId={uploadOwn.questionId}
                      value={uploadOwn.value}
                      onChange={handleUploadOwnChange}
                      maxSizeMB={uploadOwn.maxSizeMB}
                      variant="compact"
                      onActivate={selectUploadOwn}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-1 text-center">
                      <span className="grid size-12 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                        <Icon name="upload" className="size-6 text-brand-600" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700 sm:text-sm">Upload my own</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => (selected ? onChange("") : selectUploadOwn())}
                  role="radio"
                  aria-checked={selected}
                  aria-label="Upload my own"
                  className="flex w-full items-center justify-between gap-2 border-t border-slate-700 bg-slate-900 px-2.5 py-2 text-left transition hover:bg-slate-800"
                >
                  <ChoiceControlVisual variant={controlVariant} selected={selected} surface="inverse" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white sm:text-xs">
                    Select
                  </span>
                </button>
              </div>
            );
          }

          return (
            <div
              key={o.id}
              data-selected={selected ? "true" : "false"}
              className={`group relative overflow-hidden rounded-xl border text-left transition ${tileChrome}`}
            >
              <TemplateGalleryTile
                imageUrl={o.imageUrl}
                previewUrl={o.previewUrl}
                label={o.label}
                enableZoom={enableZoom}
                onZoom={(src, alt) => setPreview({ src, alt })}
              />
              <div className="flex border-t border-slate-700">
                <button
                  type="button"
                  onClick={toggle}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Select ${o.label}`}
                  className="flex flex-1 items-center justify-between gap-2 bg-slate-900 px-2.5 py-2 text-left transition hover:bg-slate-800"
                >
                  <ChoiceControlVisual variant={controlVariant} selected={selected} surface="inverse" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white sm:text-xs">
                    Select
                  </span>
                </button>
                {galleryType && (
                  <Link
                    href={`/builder?template=${encodeURIComponent(o.id)}&type=${galleryType}&name=${encodeURIComponent(o.label)}&thumb=${encodeURIComponent(o.imageUrl ?? "")}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 border-l border-slate-700 bg-teal-600 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:bg-teal-500 sm:text-xs"
                    title={`Customise ${o.label} template`}
                  >
                    🎨
                  </Link>
                )}
              </div>
            </div>
          );
        }

        return (
          <button
            key={o.id}
            type="button"
            onClick={toggle}
            data-selected={selected ? "true" : "false"}
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            aria-label={o.label}
            className={`group relative rounded-xl border text-left transition ${isButtonPreview && buttonShape === "skew" ? "overflow-visible" : "overflow-hidden"} ${tileChrome}`}
          >
            {isSwatchTile ? (
              <div className="flex aspect-[4/3] flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1">
                  {swatches.map((c, i) => (
                    <span
                      key={`${o.id}-swatch-${i}`}
                      className="min-w-0 shrink grow basis-0 transition-[flex-grow] duration-300 ease-out hover:grow-[2.75] motion-reduce:transition-none"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div
                  className={`flex shrink-0 items-center gap-2 border-t px-2 py-2 sm:px-3 ${
                    isLight
                      ? "border-slate-100 bg-white"
                      : "border-white/10 bg-[var(--color-intro-card)]"
                  }`}
                >
                  <ChoiceControlVisual
                    variant={controlVariant}
                    selected={selected}
                    size="compact"
                    surface={controlSurface}
                  />
                  <span
                    className={`line-clamp-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${
                      isLight ? "text-slate-700" : "text-white"
                    }`}
                  >
                    {o.label}
                  </span>
                </div>
              </div>
            ) : isButtonPreview && buttonShape ? (
              <>
                <span className="absolute left-2 top-2 z-20">
                  <ChoiceControlVisual
                    variant={controlVariant}
                    selected={selected}
                    surface={controlSurface}
                  />
                </span>
                <div
                  className={`flex aspect-[4/3] flex-col ${buttonShape === "skew" ? "overflow-visible p-2.5 sm:p-3" : "overflow-hidden p-2 sm:p-2.5"}`}
                >
                  <div
                    className={`flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center rounded-lg border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                      isLight
                        ? "border-slate-600/40 bg-black/35"
                        : "border-white/10 bg-black/35"
                    } ${
                      buttonShape === "skew"
                        ? "overflow-visible px-2 py-3 sm:px-3 sm:py-4"
                        : "overflow-hidden p-2.5 sm:p-3"
                    }`}
                  >
                    <ButtonStylePreviewPair shape={buttonShape} sampleText={sampleLabel} />
                  </div>
                </div>
                {isLight ? (
                  <div className="border-t border-slate-600/30 bg-slate-900/90 px-2 py-1.5 text-center text-[10px] font-medium text-white sm:text-xs">
                    {o.label}
                  </div>
                ) : null}
              </>
            ) : isLight ? (
              <div className="flex min-h-[8.5rem] w-full flex-col sm:min-h-[9.25rem]">
                <span className="absolute left-2.5 top-2.5 z-10">
                  <ChoiceControlVisual variant={controlVariant} selected={selected} />
                </span>
                <GalleryTileImage imageUrl={o.imageUrl} label={o.label} />
                <div className="border-t border-slate-100 bg-white px-2 py-2 text-center text-[11px] font-medium leading-snug text-slate-700 sm:text-xs">
                  {o.label}
                </div>
              </div>
            ) : (
              <>
                <span className="absolute left-2 top-2 z-20">
                  <ChoiceControlVisual variant={controlVariant} selected={selected} surface="inverse" />
                </span>
                <div className="relative flex aspect-[4/3] flex-col items-center justify-center bg-white px-4 py-5">
                  <GalleryTileImage imageUrl={o.imageUrl} label={o.label} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[var(--color-intro-card)]/95 px-2 py-2 text-center text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[selected=true]:opacity-100 [@media(hover:none)]:opacity-100 sm:text-sm">
                  <span className="line-clamp-2">{o.label}</span>
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
    {preview ? (
      <ImagePreviewModal
        src={preview.src}
        alt={preview.alt}
        onClose={() => setPreview(null)}
        variant={isTemplateLayout ? "template" : "default"}
      />
    ) : null}
    </>
  );
}
