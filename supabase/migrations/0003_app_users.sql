-- Admin & client accounts (JWT login; service-role access only).

create table if not exists public.app_users (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  password_hash   text not null,
  role            text not null check (role in ('admin', 'client')),
  submission_id   uuid references public.onboarding_submissions (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists app_users_email_idx on public.app_users (lower(email));
create index if not exists app_users_role_idx on public.app_users (role);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;

-- Default admin (email: example@gmail.com, password: Rainbow12345*)
insert into public.app_users (email, password_hash, role)
values (
  'example@gmail.com',
  '$2b$12$vo7dbhxMhpCf.4dp2/bZz.GUv/RbV36HFbiJEDM9i.nadwG44W5gW',
  'admin'
)
on conflict (email) do nothing;
