# Onboarding → Command HQ — Webhook Contract

**For the onboarding-app developer.** When a client finishes onboarding, your app makes **one HTTPS POST** to
Command HQ with the submission. We write it into our database, which prefills the client's workspace and feeds
our AI brain. You never touch our database directly, and we never touch yours — this endpoint is the only
integration point.

The endpoint is **already built and live** in Command HQ; it just needs the shared secret set on both sides.

---

## Endpoint

```
POST  https://hq.webuildtrades.com/api/webhooks/onboarding
Authorization: Bearer <ONBOARDING_INGEST_SECRET>
Content-Type: application/json
```

- `ONBOARDING_INGEST_SECRET` is a shared secret WBT will give you (store it server-side in YOUR app's env —
  never ship it to the browser; the POST must come from your server/route handler, not client JS).
- For local testing against a dev Command HQ: `http://localhost:3000/api/webhooks/onboarding`.

## Request body

```jsonc
{
  "submissionId": "ob_2026_000123",      // REQUIRED. Your stable id for this submission (idempotency key).
  "submittedAt": "2026-06-12T18:30:00Z", // ISO timestamp (optional)

  "client": {                            // how we match the submission to an existing WBT client
    "commandHqClientId": "uuid-here",    // BEST — exact match if you have it
    "ghlLocationId": "abc123",           // GOOD — GoHighLevel sub-account/location id
    "email": "owner@business.co.uk"      // stored for staff reference
  },

  "company": {                           // mapped onto the client's Company Info
    "companyName": "Joe's Plumbing Ltd",
    "website": "https://joesplumbing.co.uk",
    "crn": "12345678",
    "ownerFirstName": "Joe",
    "ownerLastName": "Bloggs",
    "email": "joe@joesplumbing.co.uk",
    "phone": "+44 7700 900000",
    "street": "1 High Street",
    "city": "Birmingham",
    "region": "West Midlands",
    "postcode": "B1 1AA",
    "country": "United Kingdom"
  },

  "answers": { }                         // the FULL questionnaire, verbatim — any JSON shape.
                                         // Stored whole; feeds the workspace + the AI brain.
}
```

### Field notes
- **`submissionId` is the only strictly-required field.** Send the same value on a retry — we dedupe on it.
- **Send `commandHqClientId` OR `ghlLocationId` if you possibly can** — that gives a deterministic match. With
  neither, we fall back to an exact company-name match; if that isn't unambiguous we **park** the submission
  for staff to link (we never guess a client, to avoid cross-client data leaks).
- **`answers` can be any shape** — we keep the raw blob, so you don't need to pre-map your questionnaire.

## Responses

| HTTP | `status` | Meaning | Your action |
|------|----------|---------|-------------|
| 200 | `ingested` | Matched a client and saved. | Done. |
| 200 | `duplicate` | Same `submissionId` already ingested. | Done (safe retry). |
| 202 | `pending_link` | No confident client match — parked for WBT staff to link. | Done — no retry needed; WBT links it. The response includes a `candidateClientId` when a single name match was found. |
| 400 | `bad_payload` | Missing `submissionId` or invalid JSON. | Fix and resend. |
| 401 | `unauthorized` | Missing/wrong bearer secret. | Check the secret. |
| 500 | `ingest_not_configured` / `write_failed` | Secret not set on our side, or a transient DB error. | Retry with backoff; alert WBT if it persists. |

## Behaviour guarantees
- **Idempotent** on `submissionId` — retries are safe; resubmitting updates the same record.
- **Never creates or guesses a client** — unmatched submissions return `202 pending_link`, never a wrong link.
- **Read-only toward your app** — we only receive this POST; we never call back into your database.

## curl smoke test
```bash
curl -i -X POST https://hq.webuildtrades.com/api/webhooks/onboarding \
  -H "Authorization: Bearer $ONBOARDING_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"test-001","client":{"ghlLocationId":"<a-real-location-id>"},
       "company":{"companyName":"Test Co"},"answers":{"hello":"world"}}'
```

Questions on field names or matching → WBT (this contract maps 1:1 to
`command-hq/app/api/webhooks/onboarding/route.ts`).
