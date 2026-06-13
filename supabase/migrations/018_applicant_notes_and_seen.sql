-- Migration 018: Move applicant "seen" state and private notes server-side
-- (previously stored only in the hotel's browser localStorage).

-- Whether the hotel has opened the job and seen this application.
alter table public.applications add column if not exists hotel_seen boolean default false;

-- Private per-hotel notes about an applicant, keyed by applicant email so a note
-- follows the applicant across multiple applications.
create table if not exists public.applicant_notes (
  hotel_user_id uuid not null references auth.users on delete cascade,
  applicant_email text not null,
  note text default '',
  updated_at timestamptz default now(),
  primary key (hotel_user_id, applicant_email)
);

alter table public.applicant_notes enable row level security;
create policy "Hotels manage own applicant notes" on public.applicant_notes
  for all using (auth.uid() = hotel_user_id);
