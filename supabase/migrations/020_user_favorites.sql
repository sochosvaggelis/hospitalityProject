-- Job seekers save favourite hotels and job listings.
create table if not exists public.user_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  kind text not null check (kind in ('hotel', 'job')),
  ref_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, kind, ref_id)
);

alter table public.user_favorites enable row level security;
create policy "Users manage own favourites" on public.user_favorites
  for all using (auth.uid() = user_id);
