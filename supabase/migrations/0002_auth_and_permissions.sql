-- ChurchHub auth & permissions migration.
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Idempotent: safe to re-run.
--
-- What it does:
--   1. Adds church_members  — links auth users to churches with a role.
--   2. Adds pending_invites  — invitations issued before the invitee signs up.
--   3. Helper functions: is_super_admin(), is_church_admin(), can_edit_church(),
--      claim_my_invites().
--   4. Auto-claims pending invites when a new user signs up (trigger on
--      auth.users), and via claim_my_invites() for already-existing users.
--   5. Row Level Security policies on churches, church_members,
--      pending_invites so the browser can write directly under the user's
--      session JWT without a service-role key.
--
-- Roles per church:
--   'admin' = can edit church + manage member access
--   'user'  = can edit church content but cannot invite/remove members
--
-- Super admins are identified by email. Edit the is_super_admin() function
-- below to add more.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.church_members (
  id          uuid primary key default gen_random_uuid(),
  church_id   text not null references public.churches(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin', 'user')),
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (church_id, user_id)
);

create index if not exists church_members_user_idx   on public.church_members(user_id);
create index if not exists church_members_church_idx on public.church_members(church_id);

create table if not exists public.pending_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  church_id   text not null references public.churches(id) on delete cascade,
  role        text not null check (role in ('admin', 'user')),
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index if not exists pending_invites_email_idx
  on public.pending_invites (lower(email));
create index if not exists pending_invites_church_idx
  on public.pending_invites (church_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Hardcoded super admin list. Add more emails to expand the owner pool.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in (
      'samuelehenderson@gmail.com'
    ),
    false
  );
$$;

-- security definer so RLS on church_members doesn't recurse when this
-- function is called from within church_members policies.
create or replace function public.is_church_admin(target_church_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.church_members
    where church_id = target_church_id
      and user_id   = auth.uid()
      and role      = 'admin'
  );
$$;

create or replace function public.can_edit_church(target_church_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.church_members
    where church_id = target_church_id
      and user_id   = auth.uid()
  );
$$;

grant execute on function public.is_super_admin()              to anon, authenticated;
grant execute on function public.is_church_admin(text)         to anon, authenticated;
grant execute on function public.can_edit_church(text)         to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pending invite auto-claim
-- ---------------------------------------------------------------------------

-- Fires when auth.users gets a new row. Looks up any pending_invites for the
-- new user's email and converts them into church_members rows.
create or replace function public.claim_pending_invites_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.church_members (church_id, user_id, role, invited_by)
  select pi.church_id, NEW.id, pi.role, pi.invited_by
  from public.pending_invites pi
  where lower(pi.email) = lower(NEW.email)
  on conflict (church_id, user_id) do nothing;

  delete from public.pending_invites
  where lower(email) = lower(NEW.email);

  return NEW;
end;
$$;

drop trigger if exists claim_pending_invites_on_signup on auth.users;
create trigger claim_pending_invites_on_signup
  after insert on auth.users
  for each row
  execute function public.claim_pending_invites_on_signup();

-- For already-existing users who get invited later. Frontend calls this after
-- every successful sign-in. Returns the number of invites claimed.
create or replace function public.claim_my_invites()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  claimed    int := 0;
begin
  select email into user_email
  from auth.users
  where id = auth.uid();

  if user_email is null then
    return 0;
  end if;

  with inserted as (
    insert into public.church_members (church_id, user_id, role, invited_by)
    select pi.church_id, auth.uid(), pi.role, pi.invited_by
    from public.pending_invites pi
    where lower(pi.email) = lower(user_email)
    on conflict (church_id, user_id) do nothing
    returning 1
  )
  select count(*)::int into claimed from inserted;

  delete from public.pending_invites
  where lower(email) = lower(user_email);

  return claimed;
end;
$$;

grant execute on function public.claim_my_invites() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- churches: public read, super-admin or church-member writes.
alter table public.churches enable row level security;

drop policy if exists "churches_select_public"      on public.churches;
drop policy if exists "churches_insert_super"       on public.churches;
drop policy if exists "churches_update_authorized"  on public.churches;
drop policy if exists "churches_delete_super"       on public.churches;

create policy "churches_select_public" on public.churches
  for select using (true);

create policy "churches_insert_super" on public.churches
  for insert with check (public.is_super_admin());

create policy "churches_update_authorized" on public.churches
  for update
  using       (public.can_edit_church(id))
  with check  (public.can_edit_church(id));

create policy "churches_delete_super" on public.churches
  for delete using (public.is_super_admin());

-- church_members: visible to super admin + your own rows + admins of the same church.
alter table public.church_members enable row level security;

drop policy if exists "members_select_authorized"   on public.church_members;
drop policy if exists "members_insert_authorized"   on public.church_members;
drop policy if exists "members_update_authorized"   on public.church_members;
drop policy if exists "members_delete_authorized"   on public.church_members;

create policy "members_select_authorized" on public.church_members
  for select using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.is_church_admin(church_id)
  );

create policy "members_insert_authorized" on public.church_members
  for insert with check (
    public.is_super_admin() or public.is_church_admin(church_id)
  );

create policy "members_update_authorized" on public.church_members
  for update using (
    public.is_super_admin() or public.is_church_admin(church_id)
  );

create policy "members_delete_authorized" on public.church_members
  for delete using (
    public.is_super_admin() or public.is_church_admin(church_id)
  );

-- pending_invites: only visible to super admin + church admins of that church.
alter table public.pending_invites enable row level security;

drop policy if exists "invites_select_authorized"   on public.pending_invites;
drop policy if exists "invites_insert_authorized"   on public.pending_invites;
drop policy if exists "invites_delete_authorized"   on public.pending_invites;

create policy "invites_select_authorized" on public.pending_invites
  for select using (
    public.is_super_admin() or public.is_church_admin(church_id)
  );

create policy "invites_insert_authorized" on public.pending_invites
  for insert with check (
    public.is_super_admin() or public.is_church_admin(church_id)
  );

create policy "invites_delete_authorized" on public.pending_invites
  for delete using (
    public.is_super_admin() or public.is_church_admin(church_id)
  );
