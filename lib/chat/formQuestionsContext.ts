import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";

/** Builds a compact text summary of all form questions for the AI system prompt. */
export function buildFormQuestionsContext(): string {
  const lines: string[] = ["FORM QUESTIONS REFERENCE (use this to explain any question a user asks about):"];

  for (const section of ONBOARDING_SCHEMA.sections) {
    lines.push(`\n[Section ${section.number}: ${section.title}]`);

    for (const q of section.questions) {
      if (!q.title) continue;
      const req = ("required" in q && q.required) ? " (required)" : "";
      lines.push(`• ${q.title}${req}`);
      if ("helper" in q && q.helper) {
        lines.push(`  → ${q.helper}`);
      }
      // Include sub-field names for field groups
      if ("group" in q && Array.isArray(q.group)) {
        const subFields = q.group.map((g: { title: string }) => g.title).join(", ");
        lines.push(`  Fields: ${subFields}`);
      }
    }
  }

  return lines.join("\n");
}
