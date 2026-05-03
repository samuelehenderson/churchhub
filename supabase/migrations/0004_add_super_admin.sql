-- 0004_add_super_admin.sql
-- Adds longtimegenie@gmail.com to the super-admin list. Replaces the
-- is_super_admin() function defined in 0002_auth_and_permissions.sql so
-- RLS policies that reference it pick up the new email immediately.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in (
      'samuelehenderson@gmail.com',
      'longtimegenie@gmail.com'
    ),
    false
  );
$$;

grant execute on function public.is_super_admin() to anon, authenticated;
