create table public.form_events (
  id          uuid        not null default gen_random_uuid(),
  session_id  text        not null,
  step_name   text        null,
  field_name  text        null,
  event_type  text        not null,
  timestamp   timestamp with time zone not null default now(),
  metadata    jsonb       not null default '{}'::jsonb,
  constraint form_events_pkey primary key (id)
) TABLESPACE pg_default;

alter table public.form_events enable row level security;

create index if not exists form_events_session_id_idx on public.form_events using btree (session_id) TABLESPACE pg_default;
create index if not exists form_events_event_type_idx on public.form_events using btree (event_type) TABLESPACE pg_default;
create index if not exists form_events_timestamp_idx  on public.form_events using btree (timestamp desc) TABLESPACE pg_default;
create index if not exists form_events_step_name_idx  on public.form_events using btree (step_name) TABLESPACE pg_default;
create index if not exists form_events_field_name_idx on public.form_events using btree (field_name) TABLESPACE pg_default;
