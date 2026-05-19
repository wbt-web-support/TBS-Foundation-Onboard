-- Foundation Onboarding — submissions table, indexes, RLS posture, storage bucket.
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

create table if not exists public.onboarding_submissions (
  id                          uuid primary key default gen_random_uuid(),
  resume_token                uuid not null unique default gen_random_uuid(),
  email                       text,
  phone                       text,
  tax_identification_number   text,
  current_section_index       integer not null default 0,
  answers                     jsonb not null default '{}'::jsonb,
  satisfaction_rating         integer,
  completed                   boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  completion_pdf              bytea,
  completion_pdf_filename       text
);

create index if not exists onboarding_submissions_resume_token_idx
  on public.onboarding_submissions (resume_token);
create index if not exists onboarding_submissions_email_idx
  on public.onboarding_submissions (lower(email));
create index if not exists onboarding_submissions_phone_idx
  on public.onboarding_submissions (phone);
create index if not exists onboarding_submissions_taxid_idx
  on public.onboarding_submissions (tax_identification_number);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_onboarding_submissions_updated_at on public.onboarding_submissions;
create trigger trg_onboarding_submissions_updated_at
  before update on public.onboarding_submissions
  for each row execute function public.set_updated_at();

-- RLS: enabled, with NO policies for anon/authenticated.
-- Every read/write goes through the app's route handlers using the service-role
-- key (which bypasses RLS). The browser's anon key therefore cannot touch this table.
alter table public.onboarding_submissions enable row level security;

-- Storage bucket for file uploads (proof of address, logos, van pictures).
insert into storage.buckets (id, name, public)
values ('onboarding-uploads', 'onboarding-uploads', true)
on conflict (id) do nothing;

-- Public read of objects in the bucket (writes happen via the service role only).
-- If you'd rather keep uploads private, drop this policy and serve via signed URLs.
drop policy if exists "public read onboarding-uploads" on storage.objects;
create policy "public read onboarding-uploads"
  on storage.objects for select
  using (bucket_id = 'onboarding-uploads');
