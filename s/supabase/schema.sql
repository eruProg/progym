-- Run once in the Supabase SQL editor of a new project.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  home_branch text not null default 'Cainta' check (home_branch in ('Cainta','Antipolo')),
  membership_status text not null default 'pending' check (membership_status in ('pending','active','expired')),
  valid_until date,
  created_at timestamptz not null default now(),
  check (membership_status <> 'active' or valid_until is not null)
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  trained_on date not null check (trained_on >= date '2000-01-01' and trained_on <= (now() at time zone 'Asia/Manila')::date),
  exercise text not null check (char_length(btrim(exercise)) between 1 and 80),
  weight_kg numeric(6,2) not null check (weight_kg between 0 and 500),
  reps integer not null check (reps between 1 and 100),
  created_at timestamptz not null default now()
);
create index workouts_member_date on public.workouts(member_id,trained_on desc,created_at desc);
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
revoke all on public.profiles, public.workouts from anon, authenticated;
grant select on public.profiles to authenticated;
grant update(full_name,home_branch) on public.profiles to authenticated;
grant select,insert,delete on public.workouts to authenticated;
create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy workouts_read_own on public.workouts for select to authenticated using ((select auth.uid()) = member_id);
create policy workouts_insert_own on public.workouts for insert to authenticated with check ((select auth.uid()) = member_id);
create policy workouts_delete_own on public.workouts for delete to authenticated using ((select auth.uid()) = member_id);

create function public.create_member_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,home_branch)
  values (new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data->>'full_name'),80),''),'Member'),
    case when new.raw_user_meta_data->>'home_branch' = 'Antipolo' then 'Antipolo' else 'Cainta' end);
  return new;
end;
$$;
revoke all on function public.create_member_profile() from public,anon,authenticated;
create trigger on_member_signup after insert on auth.users for each row execute procedure public.create_member_profile();
commit;
