import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "introCta";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-orange text-white hover:bg-[#e25608] disabled:opacity-50",
  secondary:
    "border border-b2 bg-panel text-ink hover:border-b3 hover:bg-surface disabled:opacity-50",
  ghost:
    "text-mid hover:text-ink hover:bg-surface disabled:opacity-50",
  introCta:
    "bg-orange px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#e25608] disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
