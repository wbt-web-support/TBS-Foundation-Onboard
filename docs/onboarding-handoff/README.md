# Onboarding app — handoff pack

For the **separate** onboarding app (its own repo + Supabase, runs on its own subdomain, e.g.
`onboarding.webuildtrades.com`). Two deliverables for the onboarding dev:

1. **[wbt-theme.css](wbt-theme.css)** — drop this at the top of the onboarding app's `globals.css` to make the
   form match Dan's portal exactly (Tailwind v4 `@theme` tokens + fonts + copy-paste component snippets). No
   `next/font` needed; fonts load via the `@import`.

2. **[WEBHOOK-CONTRACT.md](WEBHOOK-CONTRACT.md)** — on submit, the app POSTs the completed submission to
   Command HQ's `/api/webhooks/onboarding`. That writes into our DB → prefills the client workspace + feeds the
   AI brain. The two apps stay fully decoupled; this POST is the only integration point.

## Architecture (decided)
Separate app, separate DB, own subdomain → **webhook on submit** (NOT embedded, NOT a shared DB). Cleanest
decoupling: the dev ships independently, a fault in one app never affects the other.

## Status
- ✅ Webhook endpoint **built + activated** (`ONBOARDING_INGEST_SECRET` set locally; verified 401 unauth /
  400 bad-payload / 202 pending-link).
- ⏳ **To finish go-live:** (a) hand the secret to the onboarding dev; (b) set `ONBOARDING_INGEST_SECRET` in
  **Vercel** env (same value) so the production endpoint accepts real submissions; (c) dev wires the POST +
  drops in the theme.
