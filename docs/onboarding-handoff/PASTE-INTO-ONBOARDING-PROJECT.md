# Copy everything below the line into the onboarding project's AI assistant

It is self-contained — theme + webhook + secret. Paste it as one message.

---------------------------------------------------------------------------

You are working on the WeBuildTrades client **onboarding app** (a standalone Next.js + Tailwind v4 + Supabase
app that runs on its own subdomain). Do TWO things so it matches our main portal and hands completed
submissions to our Command HQ system.

## TASK 1 — Apply the WeBuildTrades brand theme

Put this block at the TOP of the app's global stylesheet (`app/globals.css` or equivalent), above all other
styles. It defines Tailwind v4 theme tokens + loads the fonts. Then restyle the existing onboarding form to
use these tokens (primary buttons `bg-orange text-white`, inputs with `border-b2 focus:border-orange`, cards
`bg-panel border-b1 shadow-card rounded-lg`, the welcome/step header as a teal hero `bg-rail text-rail-text`,
headings `font-display`). Keep the form's logic; only change the look.

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --color-canvas: #f5f5f4;   /* Warm Stone — app background */
  --color-surface: #fbfbfa;
  --color-panel: #ffffff;
  --color-raised: #ffffff;
  --color-rail: #042c37;     /* Deep Teal — hero / header */
  --color-rail-2: #063946;
  --color-rail-text: #e7f4f4;
  --color-rail-muted: #8fb6bc;
  --color-rail-line: rgba(255, 255, 255, 0.1);
  --color-b1: #eceae6;
  --color-b2: #e0ddd8;
  --color-b3: #cfcbc4;
  --color-orange: #f7630c;   /* WBT Orange — primary CTA */
  --color-orange-2: #ff8a3d;
  --color-teal: #1ca6a2;
  --color-teal-bright: #2fd7d2;
  --color-blue: #2f77c4;
  --color-green: #1f9d57;
  --color-red: #d8443c;
  --color-yellow: #e0890f;
  --color-teal-tint: #e7eef0;
  --color-cyan-tint: #e1f3f2;
  --color-orange-tint: #fdeede;
  --color-green-tint: #e7f6ed;
  --color-amber-tint: #fbf1de;
  --color-red-tint: #fbe9ea;
  --color-ink: #313131;
  --color-mid: #5f6b70;
  --color-dim: #6e747a;
  --font-display: 'Poppins', sans-serif;
  --font-body: 'Instrument Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-wbt: 8px;
  --shadow-card: 0 1px 2px rgba(4, 44, 55, 0.06);
  --shadow-lift: 0 6px 20px rgba(4, 44, 55, 0.08);
}

:root { color-scheme: light; }
body { background: var(--color-canvas); color: var(--color-ink); font-family: var(--font-body); }
h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.01em; }
```

## TASK 2 — POST the completed submission to Command HQ

When a client finishes onboarding, make ONE server-side POST (from a route handler / server action, never
client-side) to the Command HQ webhook.

1. Add to the onboarding app's `.env.local` (and later to its hosting env):
   ```
   ONBOARDING_INGEST_SECRET=<provided privately by the WBT team — set in .env.local, never commit>
   COMMAND_HQ_WEBHOOK_URL=https://hq.webuildtrades.com/api/webhooks/onboarding
   ```

2. On submit, POST JSON like this (the secret goes in the Authorization header, never in the body):
   ```ts
   await fetch(process.env.COMMAND_HQ_WEBHOOK_URL!, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.ONBOARDING_INGEST_SECRET}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       submissionId,                 // REQUIRED — your stable unique id for this submission (idempotency key)
       submittedAt: new Date().toISOString(),
       client: {                     // help us match to the right WBT client (send what you have)
         commandHqClientId,          // best, if known (a UUID)
         ghlLocationId,              // GoHighLevel location id, if known
         email,                      // owner email (stored for reference)
       },
       company: {                    // mapped onto the client's Company Info
         companyName, website, crn, ownerFirstName, ownerLastName, email,
         phone, street, city, region, postcode, country,
       },
       answers: { /* the FULL questionnaire, any JSON shape — stored verbatim */ },
     }),
   });
   ```

3. Handle the response status:
   - `200` `{status:"ingested"}` or `{status:"duplicate"}` → success (safe to retry with the same submissionId).
   - `202` `{status:"pending_link"}` → success; WBT staff will link it manually (no client matched yet). No retry.
   - `400` → fix the payload (usually a missing `submissionId`). `401` → wrong/missing secret.
   - `500` → transient; retry with backoff.

Do NOT read or write Command HQ's database directly — this single POST is the only integration. Treat the
secret as server-only.

When done, confirm with a curl smoke test:
```bash
curl -i -X POST https://hq.webuildtrades.com/api/webhooks/onboarding \
  -H "Authorization: Bearer $ONBOARDING_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"test-001","company":{"companyName":"Test Co"},"answers":{"hi":"there"}}'
# expect HTTP 202 {"status":"pending_link"} — proves auth + endpoint work end-to-end
```
