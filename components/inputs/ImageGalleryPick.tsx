"use client";

import type { GalleryOption } from "@/lib/schema/types";
import { Icon } from "@/components/ui/Icon";

export function ImageGalleryPick({
  options,
  value,
  onChange,
}: {
  options: GalleryOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(selected ? "" : o.id)}
            className={`group relative overflow-hidden rounded-lg border-2 text-left transition ${
              selected ? "border-brand-500" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-300">
              {o.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.imageUrl} alt={o.label} className="h-full w-full object-cover" />
              ) : (
                <Icon name="image" className="size-8" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium text-slate-600">
              <span className="truncate">{o.label}</span>
              {selected && (
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <Icon name="check" className="size-3" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
