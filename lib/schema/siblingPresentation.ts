import type { FieldGroupAnswer } from "../types";
import type { SubQuestion } from "./types";

/** Title & placeholder for a sub-field, including optional `labelBySibling` overrides. */
export function resolveSubFieldPresentation(
  sub: SubQuestion,
  cardScope: FieldGroupAnswer,
): { title: string; placeholder?: string } {
  const cfg = sub.labelBySibling;
  if (!cfg) {
    return { title: sub.title, placeholder: sub.placeholder };
  }
  const raw = cardScope[cfg.siblingId];
  const v = raw == null ? "" : String(raw);
  for (const rule of cfg.rules) {
    if (rule.when.oneOf?.includes(v)) {
      return { title: rule.title, placeholder: rule.placeholder ?? rule.title };
    }
    if (rule.when.equals !== undefined && v === rule.when.equals) {
      return { title: rule.title, placeholder: rule.placeholder ?? rule.title };
    }
  }
  return {
    title: cfg.default.title,
    placeholder: cfg.default.placeholder ?? cfg.default.title,
  };
}
