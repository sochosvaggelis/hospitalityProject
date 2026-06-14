-- Per-venue contact phone (a venue is an independent business, so it has its own
-- contact details rather than the account owner's).
alter table public.venues add column if not exists phone text;
