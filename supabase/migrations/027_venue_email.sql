-- Per-venue contact email (separate from the owner's login email).
alter table public.venues add column if not exists email text;
