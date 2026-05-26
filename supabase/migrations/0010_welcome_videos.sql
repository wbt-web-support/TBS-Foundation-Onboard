-- Welcome screen videos managed by admin.
create table if not exists public.welcome_videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  url         text not null default '',
  video_type  text not null default 'custom',
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists welcome_videos_sort_idx on public.welcome_videos (sort_order);

create or replace trigger trg_welcome_videos_updated_at
  before update on public.welcome_videos
  for each row execute function public.set_updated_at();

alter table public.welcome_videos enable row level security;

-- Seed the 4 default videos
insert into public.welcome_videos (title, description, url, video_type, sort_order) values
  ('Welcome to Command HQ',                   'A quick tour of your AI business operating system and what it sets out to do.',   'https://vimeo.com/1194292090', 'vimeo',  0),
  ('How to Complete Your Onboarding',         'A walkthrough of the steps and the information you''ll want to hand.',            '',                            'custom', 1),
  ('Getting the Most from the AI Assistant',  'How the writing helper turns rough notes into polished, structured answers.',     '',                            'custom', 2),
  ('What Happens After You Finish',           'How your answers train your Digital Brain and power your dashboard.',             '',                            'custom', 3)
on conflict do nothing;
