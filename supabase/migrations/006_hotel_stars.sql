-- Add star rating to hotel profiles
alter table public.profiles add column if not exists hotel_stars integer check (hotel_stars between 1 and 5);
