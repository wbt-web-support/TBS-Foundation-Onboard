"use client";

import type { GalleryOption } from "@/lib/schema/types";
import { Icon } from "@/components/ui/Icon";

type ButtonShape = NonNullable<GalleryOption["buttonShape"]>;

function shapeRadiusClass(shape: ButtonShape): string {
  if (shape === "sharp" || shape === "skew") return "rounded-none";
  if (shape === "pill") return "rounded-full";
  /* Style 4: subtle corner radius like reference (~4–6px) */
  return "rounded-[6px]";
}

function ButtonStylePreviewPair({
  shape,
  sampleText,
}: {
  shape: ButtonShape;
  sampleText: string;
}) {
  const motion =
    "transition-shadow duration-200 motion-reduce:transition-none group-hover:shadow-md";

  /* Style 3: parallelograms like reference — horizontal pair, ~17° skew, natural chip width */
  if (shape === "skew") {
    const skewOuter = "-skew-x-[17deg]";
    const skewInner = "skew-x-[17deg]";
    const chipBase =
      `inline-flex shrink-0 items-center justify-center rounded-none border-2 border-[var(--color-intro-cta)] px-3 py-2 text-[9px] font-bold uppercase tracking-widest sm:px-4 sm:py-2.5 sm:text-[10px] ${motion}`;

    return (
      <div className="flex min-w-0 flex-row flex-nowrap items-center justify-center gap-2.5 sm:gap-3">
        <span className={`inline-flex shrink-0 origin-center ${skewOuter}`}>
          <span
            className={`inline-flex shrink-0 origin-center ${skewInner} ${chipBase} bg-[var(--color-intro-cta)] text-white group-hover:brightness-105`}
          >
            {sampleText}
          </span>
        </span>
        <span className={`inline-flex shrink-0 origin-center ${skewOuter}`}>
          <span
            className={`inline-flex shrink-0 origin-center ${skewInner} ${chipBase} bg-white text-[var(--color-intro-cta)]`}
          >
            {sampleText}
          </span>
        </span>
      </div>
    );
  }

  const base =
    `box-border flex w-full min-w-0 max-w-full items-center justify-center border-2 border-[var(--color-intro-cta)] px-1.5 py-1.5 text-center text-[8px] font-bold uppercase leading-tight tracking-wide sm:px-2 sm:py-2 sm:text-[9px] ${motion} ` +
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
}: {
  options: GalleryOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const isButtonStyleGallery = options.some((o) => Boolean(o.buttonShape));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

        const tileChrome =
          isButtonStyleGallery && isButtonPreview
            ? selected
              ? "border-brand-500 bg-[var(--color-intro-card)] ring-1 ring-brand-500"
              : "border-slate-600/90 bg-[var(--color-intro-card)] hover:border-slate-500"
            : selected
              ? "border-brand-500 bg-[var(--color-intro-card)] ring-1 ring-brand-500"
              : "border-white/20 bg-white/5 hover:border-white/35";

        return (
          <button
            key={o.id}
            type="button"
            onClick={toggle}
            data-selected={selected ? "true" : "false"}
            aria-pressed={selected}
            aria-label={o.label}
            className={`group relative overflow-hidden rounded-xl border text-left transition ${tileChrome}`}
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
                <div className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-[var(--color-intro-card)] px-2 py-2 sm:px-3">
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full border-2 sm:size-5 ${
                      selected ? "border-[var(--color-intro-cta)]" : "border-white/70"
                    }`}
                    aria-hidden
                  >
                    {selected ? (
                      <span className="size-2 rounded-full bg-[var(--color-intro-cta)]" />
                    ) : null}
                  </span>
                  <span className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-white sm:text-xs">
                    {o.label}
                  </span>
                </div>
              </div>
            ) : isButtonPreview && buttonShape ? (
              <div
                className={`flex aspect-[4/3] flex-col overflow-hidden ${buttonShape === "skew" ? "p-2.5 sm:p-3" : "p-2 sm:p-2.5"}`}
              >
                <div
                  className={`flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                    buttonShape === "skew"
                      ? "overflow-visible px-2 py-3 sm:px-3 sm:py-4"
                      : "overflow-hidden p-2.5 sm:p-3"
                  }`}
                >
                  <ButtonStylePreviewPair shape={buttonShape} sampleText={sampleLabel} />
                </div>
              </div>
            ) : (
              <>
                <div className="relative flex aspect-[4/3] items-center justify-center bg-white px-4 py-5">
                  {o.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.imageUrl}
                      alt=""
                      className="relative z-0 max-h-[5.25rem] w-auto max-w-[72%] object-contain sm:max-h-24"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Icon name="image" className="relative z-0 size-8 text-slate-300" />
                  )}
                </div>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[var(--color-intro-card)]/95 px-2 py-2 text-center text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[selected=true]:opacity-100 [@media(hover:none)]:opacity-100 sm:text-sm"
                >
                  <span className="line-clamp-2">{o.label}</span>
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
