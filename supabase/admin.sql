-- Run once after schema.sql in the Supabase SQL Editor. Safe to re-run.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.progym_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,40}$'),
  created_at timestamptz not null default now()
);
create table if not exists private.membership_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  member_id uuid not null,
  old_status text,
  new_status text,
  old_expiry date,
  new_expiry date,
  changed_at timestamptz not null default now()
);
alter table private.progym_admins enable row level security;
alter table private.membership_audit enable row level security;
revoke all on private.progym_admins, private.membership_audit from public,anon,authenticated;

create or replace function public.is_progym_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.progym_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_progym_admin() from public,anon;
grant execute on function public.is_progym_admin() to authenticated;

create or replace function public.admin_members(p_search text default '', p_status text default 'all', p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_progym_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_offset is null or p_search is null or p_status is null or p_offset < 0 or p_offset > 1000000 or char_length(p_search) > 100 or p_status not in ('all','pending','active','expired') then
    raise exception 'Invalid member filter' using errcode='22023';
  end if;
  with members as (
    select p.id,p.full_name,p.home_branch,p.membership_status,p.valid_until,p.created_at,u.email,
    case when p.membership_status='active' and p.valid_until >= (now() at time zone 'Asia/Manila')::date then 'active'
         when p.membership_status='active' or p.membership_status='expired' then 'expired' else 'pending' end as effective_status
    from public.profiles p join auth.users u on u.id=p.id
    where not exists(select 1 from private.progym_admins a where a.user_id=p.id)
  ), filtered as (
    select * from members where (p_status='all' or effective_status=p_status)
      and (p_search='' or strpos(lower(full_name),lower(p_search))>0 or strpos(lower(email),lower(p_search))>0)
  ), page as (select * from filtered order by created_at desc,id limit 25 offset p_offset)
  select jsonb_build_object('members',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),
    'total',(select count(*) from filtered),
    'stats',jsonb_build_object('total',(select count(*) from members),'active',(select count(*) from members where effective_status='active'),
      'pending',(select count(*) from members where effective_status='pending'),'expired',(select count(*) from members where effective_status='expired')),
    'renewals',coalesce((select jsonb_agg(to_jsonb(r)) from (select * from members where effective_status='active' and valid_until <= (now() at time zone 'Asia/Manila')::date+7 order by valid_until,id limit 10) r),'[]'::jsonb)) into result;
  return result;
end;
$$;
revoke all on function public.admin_members(text,text,integer) from public,anon;
grant execute on function public.admin_members(text,text,integer) to authenticated;

create or replace function public.admin_update_membership(p_member_id uuid,p_name text,p_branch text,p_status text,p_expiry date)
returns void language plpgsql security definer set search_path = '' as $$
declare previous public.profiles;
begin
  if not public.is_progym_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 or p_branch is null or p_branch not in ('Cainta','Antipolo')
    or p_status is null or p_status not in ('pending','active','expired') or (p_status='active' and (p_expiry is null or p_expiry < (now() at time zone 'Asia/Manila')::date)) then
    raise exception 'Enter valid member details and a current expiry for active memberships' using errcode='22023';
  end if;
  if exists(select 1 from private.progym_admins where user_id=p_member_id) then raise exception 'Staff accounts are managed separately' using errcode='42501'; end if;
  select * into previous from public.profiles where id=p_member_id for update;
  if not found then raise exception 'Member not found' using errcode='P0002'; end if;
  update public.profiles set full_name=btrim(p_name),home_branch=p_branch,membership_status=p_status,valid_until=p_expiry where id=p_member_id;
  insert into private.membership_audit(actor_id,member_id,old_status,new_status,old_expiry,new_expiry)
    values(auth.uid(),p_member_id,previous.membership_status,p_status,previous.valid_until,p_expiry);
end;
$$;
revoke all on function public.admin_update_membership(uuid,text,text,text,date) from public,anon;
grant execute on function public.admin_update_membership(uuid,text,text,text,date) to authenticated;

-- Account provisioning only: never callable with a browser publishable key.
create or replace function public.provision_progym_admin(p_user_id uuid,p_username text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_username is null or lower(p_username) !~ '^[a-z0-9_]{3,40}$' then raise exception 'Invalid admin username'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and lower(email)=lower(p_username)||'@admin.progym.invalid' and email_confirmed_at is not null) then
    raise exception 'Create and confirm the matching admin account first';
  end if;
  insert into private.progym_admins(user_id,username) values(p_user_id,lower(p_username)) on conflict(user_id) do update set username=excluded.username;
end;
$$;
revoke all on function public.provision_progym_admin(uuid,text) from public,anon,authenticated;
grant execute on function public.provision_progym_admin(uuid,text) to service_role;
commit;
