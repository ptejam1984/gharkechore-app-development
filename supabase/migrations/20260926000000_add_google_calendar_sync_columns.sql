alter table public.profiles add column if not exists google_calendar_connected boolean not null default false;
alter table public.profiles add column if not exists family_calendar_id text;
alter table public.chore_occurrences add column if not exists personal_google_event_id text;
alter table public.chore_occurrences add column if not exists family_google_event_id text;
