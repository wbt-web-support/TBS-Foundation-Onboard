-- Automatically create an app_users row whenever a user is created
-- in Supabase Authentication.
-- Role is read from user metadata (raw_user_meta_data->>'role').
-- If no role is provided, defaults to 'admin'.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  )
  on conflict (email) do update
    set id = excluded.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
