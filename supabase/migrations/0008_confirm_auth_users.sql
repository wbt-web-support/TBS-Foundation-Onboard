-- Confirm the email of every existing Supabase Auth user so they can log in
-- without needing to click a confirmation link.
-- Safe to run multiple times (only updates rows where email is still unconfirmed).

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- Also backfill any auth users missing from app_users (e.g. created before trigger 0007).
insert into public.app_users (id, email, role)
select id, email, coalesce(raw_user_meta_data->>'role', 'admin')
from auth.users
on conflict (email) do update set id = excluded.id;
