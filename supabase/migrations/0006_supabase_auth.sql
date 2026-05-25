-- Migrate password management to Supabase Authentication.
-- The password_hash column is no longer needed; Supabase Auth owns credentials.
-- Existing admin accounts must be (re-)created in Supabase Auth
-- (Authentication → Users → Add user) with the same email address.

alter table public.app_users drop column if exists password_hash;
