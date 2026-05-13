# Foundation Onboarding

The WBT "Foundation onboarding 2026" questionnaire — a single-page, schema-driven
multi-step form with autosave to Supabase and a resume-by-email magic link.

## How it's built

- **Schema-driven** — every question and its conditional routing lives in
  [`lib/schema/questions.ts`](lib/schema/questions.ts). One generic renderer
  ([`components/onboarding/QuestionRenderer.tsx`](components/onboarding/QuestionRenderer.tsx))
  handles all question types; follow-up questions show/hide via `visibleIf` rules
  evaluated in [`lib/schema/visibility.ts`](lib/schema/visibility.ts).
- **Single page, no route changes** — all state is client-side
  ([`components/onboarding/OnboardingApp.tsx`](components/onboarding/OnboardingApp.tsx),
  a `useReducer`). The sidebar sections just navigate within the page.
- **Persistence** — answers autosave (debounced) to a Supabase `onboarding_submissions`
  row via [`app/api/submission/route.ts`](app/api/submission/route.ts). Files go to
  Supabase Storage via [`app/api/upload/route.ts`](app/api/upload/route.ts).
- **Resume** — after the email step, a magic link (`/?token=...`) is emailed via Resend
  ([`app/api/resume-link/route.ts`](app/api/resume-link/route.ts)). Visiting the link
  rehydrates the saved progress.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
```

In Supabase: run [`supabase/migrations/0001_onboarding_submissions.sql`](supabase/migrations/0001_onboarding_submissions.sql)
in the SQL editor. It creates the table, indexes, RLS posture (RLS on, no anon policies —
all access is server-side via the service-role key) and the `onboarding-uploads` storage bucket.

Required env vars (see `.env.local.example`):

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser key (can't touch the table — no anon RLS policies) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only**, never `NEXT_PUBLIC_`; route handlers use it |
| `NEXT_PUBLIC_APP_URL` | base URL for the emailed resume link |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | verified sender; `onboarding@resend.dev` works for dev |

## Run

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Without Supabase configured the form still renders and you can walk every section;
autosave/upload/email calls return 503 and the UI shows a "couldn't save" status.

## Image galleries

A few steps (logo styles, Real/Animated/Mixed template galleries, 12 colour palettes,
4 button styles) use placeholder tiles until real assets land. Drop real
`{ id, label, imageUrl }[]` arrays into [`lib/schema/galleries.ts`](lib/schema/galleries.ts);
no other changes needed. If you switch to `next/image` for remote assets, add their host
to `images.remotePatterns` in `next.config.ts`.
