create extension if not exists pgcrypto;

create type public.member_role as enum ('admin', 'member', 'visual');
create type public.chore_frequency as enum ('daily', 'weekly', 'monthly', 'flexible_weekend', 'on_demand');
create type public.occurrence_status as enum ('open', 'done', 'later', 'need_help', 'cancelled');
create type public.change_status as enum ('pending', 'accepted', 'declined', 'cancelled');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 100),
  role public.member_role not null default 'member',
  visual_only boolean not null default false,
  timezone text not null default 'Europe/London',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chore_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  frequency public.chore_frequency not null,
  weekday smallint check (weekday between 0 and 6),
  due_time time,
  due_day smallint check (due_day between 1 and 31),
  active boolean not null default true,
  configuration_complete boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((frequency = 'weekly' and weekday is not null) or frequency <> 'weekly'),
  check ((frequency = 'monthly' and due_day is not null) or frequency <> 'monthly')
);

create table public.chore_assignments (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.chore_templates(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  label text,
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  unique (template_id, profile_id, starts_on)
);

create table public.chore_occurrences (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.chore_templates(id) on delete restrict,
  assignment_id uuid references public.chore_assignments(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete restrict,
  occurrence_date date not null,
  due_at timestamptz,
  status public.occurrence_status not null default 'open',
  washing_done boolean not null default false,
  drying_done boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, assignment_id, occurrence_date)
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  meal_date date not null,
  slot public.meal_slot not null,
  dish_name text,
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  diners smallint not null default 0 check (diners between 0 and 50),
  ingredients text,
  preparation_notes text,
  malhar_alternative text,
  leftovers boolean not null default false,
  eating_out boolean not null default false,
  quick_backup text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (meal_date, slot)
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(trim(label)) between 1 and 200),
  quantity text,
  purchased boolean not null default false,
  added_by uuid not null references public.profiles(id) on delete restrict,
  purchased_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.chore_occurrences(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  proposed_profile_id uuid references public.profiles(id) on delete restrict,
  proposed_date date,
  reason text,
  status public.change_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index chore_occurrences_date_idx on public.chore_occurrences (occurrence_date, status);
create index chore_occurrences_assignee_idx on public.chore_occurrences (assigned_to, occurrence_date);
create index meals_week_idx on public.meals (week_start, meal_date);
create index change_requests_status_idx on public.change_requests (status, created_at);

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.chore_templates enable row level security;
alter table public.chore_assignments enable row level security;
alter table public.chore_occurrences enable row level security;
alter table public.meals enable row level security;
alter table public.shopping_items enable row level security;
alter table public.change_requests enable row level security;
alter table public.audit_log enable row level security;

create policy "family can view profiles" on public.profiles for select to authenticated using (true);
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "family can view chore templates" on public.chore_templates for select to authenticated using (true);
create policy "admins manage chore templates" on public.chore_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "family can view chore assignments" on public.chore_assignments for select to authenticated using (true);
create policy "admins manage chore assignments" on public.chore_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "family can view occurrences" on public.chore_occurrences for select to authenticated using (true);
create policy "assignees update own occurrences" on public.chore_occurrences for update to authenticated
  using ((select auth.uid()) = assigned_to)
  with check ((select auth.uid()) = assigned_to);
create policy "admins manage occurrences" on public.chore_occurrences for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "family can view meals" on public.meals for select to authenticated using (true);
create policy "admins manage meals" on public.meals for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "family can manage shopping" on public.shopping_items for all to authenticated using (true) with check ((select auth.uid()) is not null);

create policy "family can view changes" on public.change_requests for select to authenticated using (true);
create policy "members create own changes" on public.change_requests for insert to authenticated with check ((select auth.uid()) = requested_by);
create policy "admins review changes" on public.change_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins view audit log" on public.audit_log for select to authenticated using (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger chore_templates_set_updated_at before update on public.chore_templates for each row execute function public.set_updated_at();
create trigger chore_occurrences_set_updated_at before update on public.chore_occurrences for each row execute function public.set_updated_at();
create trigger meals_set_updated_at before update on public.meals for each row execute function public.set_updated_at();
create trigger shopping_items_set_updated_at before update on public.shopping_items for each row execute function public.set_updated_at();

comment on table public.chore_templates is 'Recurring chore definitions; generated dated work belongs in chore_occurrences.';
comment on table public.chore_occurrences is 'Immutable occurrence history with status and completion metadata.';
comment on table public.change_requests is 'Swap and rescheduling requests; ownership changes only after admin acceptance.';
comment on column public.chore_templates.configuration_complete is 'False when required timing or frequency details still need admin setup.';

-- Seed profiles are intentionally not inserted here because auth.users IDs are project-specific.
-- Create the three authenticated family profiles after inviting users, then add Malhar as a visual profile if needed.
-- Seed the supplied recurring schedules through the admin UI or a project-specific seed script after profiles exist.
