-- Add resume_url to profiles for server users
alter table public.profiles add column if not exists resume_url text;
