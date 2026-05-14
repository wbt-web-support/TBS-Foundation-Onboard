"use client";

import type { GalleryOption } from "@/lib/schema/types";
import { Icon } from "@/components/ui/Icon";

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
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((o) => {
        const selected = selectedValues.includes(o.id);
        const swatches = o.swatchColors?.filter(Boolean) ?? [];
        const isSwatchTile = swatches.length > 0;
        const toggle = () => {
          if (multiple) {
            onChange(selected ? selectedValues.filter((id) => id !== o.id) : [...selectedValues, o.id]);
          } else {
            onChange(selected ? "" : o.id);
          }
        };
        return (
          <button
            key={o.id}
            type="button"
            onClick={toggle}
            data-selected={selected ? "true" : "false"}
            aria-pressed={selected}
            aria-label={o.label}
            className={`group relative overflow-hidden rounded-lg border text-left transition ${
              selected
                ? "border-brand-500 bg-[var(--color-intro-card)] ring-1 ring-brand-500"
                : "border-white/20 bg-white/5 hover:border-white/35"
            }`}
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
