import { asStringOrNull, getByPath } from "@/lib/answers";
import type { Answers, FieldGroupAnswer } from "@/lib/types";

/** First name from the "Enter your name" field group. */
export function getApplicantFirstName(answers: Answers): string | null {
  const card = answers.your_name;
  if (card && typeof card === "object" && !Array.isArray(card)) {
    const raw = (card as FieldGroupAnswer).first_name;
    const first = typeof raw === "string" ? raw.trim() : "";
    if (first) return first;
  }
  return asStringOrNull(getByPath(answers, "your_name.first_name"));
}

/** Full name from first + last in the "Enter your name" field group. */
export function getApplicantFullName(answers: Answers): string | null {
  const card = answers.your_name;
  if (card && typeof card === "object" && !Array.isArray(card)) {
    const fg = card as FieldGroupAnswer;
    const first = typeof fg.first_name === "string" ? fg.first_name.trim() : "";
    const last = typeof fg.last_name === "string" ? fg.last_name.trim() : "";
    const full = [first, last].filter(Boolean).join(" ");
    if (full) return full;
  }
  const first = asStringOrNull(getByPath(answers, "your_name.first_name"));
  const last = asStringOrNull(getByPath(answers, "your_name.last_name"));
  const full = [first, last].filter(Boolean).join(" ");
  return full || null;
}

/**
 * Best label for email greetings: first name → full name → company name.
 * Save progress is often used before "Enter your name" is filled.
 */
export function getApplicantDisplayName(answers: Answers): string | null {
  return (
    getApplicantFirstName(answers) ??
    getApplicantFullName(answers) ??
    asStringOrNull(getByPath(answers, "company_details.company_name"))
  );
}
