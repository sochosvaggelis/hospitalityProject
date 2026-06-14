-- ============================================================
-- SeaSide Jobs — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Before running:
--   1. Go to Authentication → Settings → disable "Enable email confirmations"
--      (so users can log in immediately after registering)
--   2. Go to Storage → create a bucket called "uploads" (set to public)
-- ============================================================

-- ============================================================
-- Reference tables (static/admin-managed data)
-- See migrations/001_reference_tables.sql for full SQL + seed data
-- ============================================================

-- islands (name, outline_url, display_order)
-- categories (key, display_order)
-- employment_types (key, display_order)

-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'hotel', 'admin')),
  role_chosen boolean default false,
  phone text,
  bio text,
  location text,
  experience_years integer default 0,
  skills text,
  languages_spoken text,
  hotel_name text,
  hotel_description text,
  hotel_website text,
  hotel_logo_url text,
  resume_url text,
  created_at timestamptz default now()
);

-- Jobs
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  hotel_name text not null,
  hotel_user_id uuid references auth.users not null,
  location text not null,
  description text not null,
  requirements text,
  employment_type text not null check (employment_type in ('full_time','part_time','seasonal','temporary')),
  salary_range text,
  positions_available integer default 1,
  start_date text,
  end_date text,
  status text default 'active' check (status in ('active','closed','draft')),
  category text not null check (category in ('fine_dining','wine_expert','pool_beach','breakfast','banquet','room_service','head_waiter','catering')),
  benefits text,
  hotel_logo text
);

-- Applications
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  job_id uuid references public.jobs on delete cascade not null,
  job_title text not null,
  hotel_name text not null,
  hotel_user_id uuid references auth.users not null,
  applicant_name text not null,
  applicant_email text not null,
  cover_letter text,
  resume_url text,
  status text default 'pending' check (status in ('pending','reviewed','accepted','rejected','withdrawn'))
);

-- Conversations
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  participant_1 text not null,
  participant_2 text not null,
  participant_1_name text not null,
  participant_2_name text not null,
  job_id uuid,
  job_title text,
  last_message text,
  last_message_date timestamptz,
  unread_by text
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_email text not null,
  sender_name text not null,
  content text not null,
  read boolean default false
);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update updated_at on conversations
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure update_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Admin role update function (avoids RLS circular reference)
create or replace function public.update_user_role(target_user_id uuid, new_role text)
returns void as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Not authorized';
  end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles
create policy "Profiles viewable by everyone" on public.profiles
  for select using (true);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Jobs
create policy "Jobs viewable by everyone" on public.jobs
  for select using (true);
create policy "Hotels create jobs" on public.jobs
  for insert with check (auth.uid() = hotel_user_id);
create policy "Hotels update own jobs" on public.jobs
  for update using (auth.uid() = hotel_user_id);
create policy "Owner or admin delete jobs" on public.jobs
  for delete using (auth.uid() = hotel_user_id);

-- Applications
create policy "View own applications" on public.applications
  for select using (
    applicant_email = (select email from auth.users where id = auth.uid())
    or hotel_user_id = auth.uid()
  );
create policy "Authenticated users create applications" on public.applications
  for insert with check (auth.uid() is not null);
create policy "Hotels update application status" on public.applications
  for update using (hotel_user_id = auth.uid());

-- Conversations
create policy "Participants view conversations" on public.conversations
  for select using (
    participant_1 = (select email from auth.users where id = auth.uid())
    or participant_2 = (select email from auth.users where id = auth.uid())
  );
create policy "Authenticated users create conversations" on public.conversations
  for insert with check (auth.uid() is not null);
create policy "Participants update conversations" on public.conversations
  for update using (
    participant_1 = (select email from auth.users where id = auth.uid())
    or participant_2 = (select email from auth.users where id = auth.uid())
  );

-- Messages
create policy "Participants view messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (
        c.participant_1 = (select email from auth.users where id = auth.uid())
        or c.participant_2 = (select email from auth.users where id = auth.uid())
      )
    )
  );
create policy "Authenticated users create messages" on public.messages
  for insert with check (auth.uid() is not null);
