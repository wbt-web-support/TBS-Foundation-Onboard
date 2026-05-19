-- Persist completion PDF in the database (served via admin API).

alter table public.onboarding_submissions
  add column if not exists completion_pdf bytea,
  add column if not exists completion_pdf_filename text;
