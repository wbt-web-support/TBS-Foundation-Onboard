import { asStringOrNull } from "@/lib/answers";
import { FOUNDATION_COMPLETION_PDF_URL_KEY } from "@/lib/submission/foundationAppAnswersKey";
import type { AnswerValue } from "@/lib/types";

/** Bunny CDN URL saved on submit — same link as in completion emails. */
export function getBunnyCompletionPdfUrl(stored: Record<string, unknown>): string | null {
  const url = asStringOrNull(stored[FOUNDATION_COMPLETION_PDF_URL_KEY] as AnswerValue);
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url.trim();
}
