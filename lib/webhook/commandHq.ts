import { getByPath, asStringOrNull } from "@/lib/answers";
import { COUNTRY_OPTIONS } from "@/lib/schema/countries";
import type { Answers } from "@/lib/types";

/**
 * Command HQ ingest webhook.
 *
 * On completion the onboarding app makes ONE server-side POST to Command HQ with
 * the submission. Command HQ writes it into its database (prefills the client's
 * workspace + feeds its AI brain). This is the only integration point — we never
 * touch their DB and they never touch ours.
 *
 * Contract: docs/onboarding-handoff/WEBHOOK-CONTRACT.md
 *   POST  $COMMAND_HQ_WEBHOOK_URL
 *   Authorization: Bearer $ONBOARDING_INGEST_SECRET
 *   body: { submissionId (required), submittedAt, client, company, answers }
 * Idempotent on submissionId — safe to retry; Command HQ dedupes.
 */

export type CommandHqCompany = {
  companyName?: string;
  website?: string;
  crn?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

export type CommandHqPayload = {
  submissionId: string;
  submittedAt: string;
  client: { commandHqClientId?: string; ghlLocationId?: string; email?: string };
  company: CommandHqCompany;
  answers: Answers;
};

export type CommandHqResult = {
  ok: boolean;
  status: number;
  /** Command HQ's `status` field: ingested | duplicate | pending_link | bad_payload | unauthorized | ... */
  result?: string;
  /** True when the webhook is not configured (env vars missing) — not an error. */
  skipped?: boolean;
  error?: string;
};

const countryLabelByValue = new Map(COUNTRY_OPTIONS.map((o) => [o.value, o.label]));

/** Country answers are stored as slugged values — send the human label when we can. */
function resolveCountry(value: string | null): string | undefined {
  if (!value) return undefined;
  return countryLabelByValue.get(value) ?? value;
}

export function buildCommandHqPayload(
  submissionId: string,
  appAnswers: Answers,
  submittedAt: string,
): CommandHqPayload {
  const s = (path: string) => asStringOrNull(getByPath(appAnswers, path)) ?? undefined;

  const company: CommandHqCompany = {
    companyName: s("company_details.company_name"),
    website: s("current_website_domain") ?? s("affiliated_website_url"),
    crn: s("company_details.company_registration_number"),
    ownerFirstName: s("your_name.first_name"),
    ownerLastName: s("your_name.last_name"),
    email: s("company_details.business_email"),
    phone: s("company_details.phone_number"),
    street: s("company_address.street_address"),
    city: s("company_address.city"),
    region: s("company_address.state_region"),
    postcode: s("company_address.postal_code"),
    country: resolveCountry(s("company_address.country") ?? null),
  };

  return {
    submissionId,
    submittedAt,
    client: { email: company.email },
    company,
    answers: appAnswers,
  };
}

function backoffMs(attempt: number): number {
  return [0, 600, 1800][attempt] ?? 1800;
}

/**
 * POST the payload to Command HQ. Retries only on 5xx (transient). 2xx is success
 * (ingested / duplicate / pending_link); 400/401 are not retried. No-op (skipped)
 * when env vars are unset, so local/dev completions don't error.
 */
export async function sendOnboardingToCommandHq(
  payload: CommandHqPayload,
  { maxAttempts = 3 }: { maxAttempts?: number } = {},
): Promise<CommandHqResult> {
  const url = process.env.COMMAND_HQ_WEBHOOK_URL;
  const secret = process.env.ONBOARDING_INGEST_SECRET;

  if (!url || !secret) {
    console.warn(
      "[command-hq] webhook skipped — set COMMAND_HQ_WEBHOOK_URL and ONBOARDING_INGEST_SECRET to enable.",
    );
    return { ok: false, status: 0, skipped: true };
  }

  let last: CommandHqResult = { ok: false, status: 0 };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, backoffMs(attempt)));

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12_000),
      });

      let result: string | undefined;
      try {
        const json = (await res.json()) as { status?: string };
        result = json?.status;
      } catch {
        /* non-JSON body — ignore */
      }

      if (res.ok || res.status === 202) {
        return { ok: true, status: res.status, result };
      }

      last = { ok: false, status: res.status, result };
      // Client errors won't change on retry.
      if (res.status === 400 || res.status === 401 || res.status === 403) return last;
      // Otherwise (5xx) fall through and retry.
    } catch (err) {
      last = { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return last;
}

/**
 * Fire-and-safe completion notification. Builds the payload and posts it, never
 * throwing — call this from a route handler's `after()` so it runs post-response.
 */
export async function notifyCommandHqOnCompletion(args: {
  submissionId: string;
  appAnswers: Answers;
  submittedAt?: string;
}): Promise<CommandHqResult> {
  try {
    const payload = buildCommandHqPayload(
      args.submissionId,
      args.appAnswers,
      args.submittedAt ?? new Date().toISOString(),
    );
    const res = await sendOnboardingToCommandHq(payload);
    if (res.skipped) return res;
    if (res.ok) {
      console.log(`[command-hq] submission ${args.submissionId} → ${res.result ?? res.status}`);
    } else {
      console.error(
        `[command-hq] submission ${args.submissionId} FAILED — status ${res.status}${res.result ? ` (${res.result})` : ""}${res.error ? ` ${res.error}` : ""}`,
      );
    }
    return res;
  } catch (err) {
    console.error("[command-hq] notify threw:", err);
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
