-- Fix admin password hash for example@gmail.com / Rainbow12345*
-- (Use if login fails after 0003 was run with a wrong hash.)

update public.app_users
set password_hash = '$2b$12$vo7dbhxMhpCf.4dp2/bZz.GUv/RbV36HFbiJEDM9i.nadwG44W5gW'
where email = 'example@gmail.com';
