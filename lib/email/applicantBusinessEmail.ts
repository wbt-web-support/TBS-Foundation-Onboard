import { asStringOrNull, getByPath } from "@/lib/answers";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import type { Answers } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Business email from "Enter your company contact details" → `company_contact.business_email`. */
export function applicantBusinessEmail(answers: Answers | null | undefined): string | null {
  if (!answers || typeof answers !== "object") return null;
  const v = asStringOrNull(getByPath(answers, ONBOARDING_SCHEMA.keyFields.email));
  return v && EMAIL_RE.test(v) ? v : null;
}
