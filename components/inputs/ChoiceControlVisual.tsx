"use client";

import { Icon } from "@/components/ui/Icon";

/** Visual radio / checkbox used across choice cards and gallery tiles. */
export function ChoiceControlVisual({
  variant,
  selected,
  size = "default",
  surface = "default",
  className = "",
}: {
  variant: "radio" | "checkbox";
  selected: boolean;
  /** `compact` fits dense gallery footers (e.g. swatch row). */
  size?: "default" | "compact";
  /** `inverse` for dark tile backgrounds (gallery). */
  surface?: "default" | "inverse";
  className?: string;
}) {
  const box =
    size === "compact"
      ? "grid size-4 shrink-0 place-items-center border sm:size-5"
      : "grid size-5 shrink-0 place-items-center border";
  const checkIcon = size === "compact" ? "size-3 sm:size-3.5" : "size-3.5";
  const radioDot = size === "compact" ? "size-1.5 rounded-full sm:size-2" : "size-2 rounded-full";
  const inactiveRing =
    surface === "inverse" ? "border-white/70 bg-white/5 text-transparent" : "border-slate-300 bg-white text-transparent";
  const activeRing = "border-brand-600 bg-brand-600 text-white";
  return (
    <span
      className={`${box} ${
        variant === "radio" ? "rounded-full" : "rounded"
      } ${selected ? activeRing : inactiveRing} ${className}`}
      aria-hidden
    >
      {variant === "radio" ? (
        <span className={`${radioDot} ${selected ? "bg-white" : "bg-transparent"}`} />
      ) : (
        <Icon name="check" className={checkIcon} />
      )}
    </span>
  );
}
