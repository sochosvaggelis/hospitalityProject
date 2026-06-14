-- Phase 1: multiple venues per hotel account.
-- A venue is a physical shop/property owned by a hotel account. Jobs reference a
-- venue and snapshot its name/location/coordinates/logo at creation time, so a
-- single account can post for several venues on the same or different islands.

create table if not exists public.venues (
  id uuid default gen_random_uuid() primary key,
  owner_user_id uuid references auth.users not null,
  name text not null,
  location text,
  lat double precision,
  lng double precision,
  logo_url text,
  created_at timestamptz default now()
);

create index if not exists venues_owner_idx on public.venues (owner_user_id);

alter table public.jobs add column if not exists venue_id uuid references public.venues;

-- Row level security (backend uses the service role and bypasses these; the
-- policies guard any direct client access).
alter table public.venues enable row level security;
do $$ begin
  create policy "venues are publicly readable" on public.venues for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owners insert their venues" on public.venues for insert with check (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owners update their venues" on public.venues for update using (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owners delete their venues" on public.venues for delete using (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

-- Backfill: create one venue per existing hotel account from its current profile
-- identity, then link that account's existing jobs to it.
-- logo_url is left null on purpose: in Phase 1 the listing logo still follows the
-- account (so changing the account avatar keeps updating jobs). Per-venue logos
-- are a Phase 2 addition.
insert into public.venues (owner_user_id, name, location, lat, lng)
select p.id,
       coalesce(nullif(p.hotel_name, ''), p.full_name, 'My venue'),
       p.location, p.lat, p.lng
from public.profiles p
where p.role = 'hotel'
  and not exists (select 1 from public.venues v where v.owner_user_id = p.id);

update public.jobs j
set venue_id = v.id
from public.venues v
where v.owner_user_id = j.hotel_user_id
  and j.venue_id is null;
