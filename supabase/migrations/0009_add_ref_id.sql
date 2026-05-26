-- Add a sequential human-readable reference ID to submissions.
-- Used in the public URL as ?id=<ref_id> instead of ?token=<uuid>.

alter table public.onboarding_submissions
  add column if not exists ref_id bigint generated always as identity;

create unique index if not exists onboarding_submissions_ref_id_idx
  on public.onboarding_submissions (ref_id);
