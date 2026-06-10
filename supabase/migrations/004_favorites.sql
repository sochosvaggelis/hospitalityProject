-- Favorites: hotels star applicants
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  hotel_user_id uuid references auth.users on delete cascade not null,
  applicant_email text not null,
  applicant_name text not null,
  created_at timestamptz default now(),
  unique(hotel_user_id, applicant_email)
);

alter table public.favorites enable row level security;
create policy "Hotels manage own favorites" on public.favorites
  for all using (auth.uid() = hotel_user_id);
