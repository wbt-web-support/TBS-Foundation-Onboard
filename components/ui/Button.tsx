import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "introCta";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-200 disabled:text-white",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  introCta:
    "!rounded-xl bg-intro-cta px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-intro-cta-hover disabled:bg-intro-cta/40 disabled:text-white/90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
