-- A venue can show up to 3 photos on its public page (hero + thumbnail strip),
-- distinct from its logo. Stored as an ordered array of public URLs.
alter table public.venues add column if not exists photos text[] not null default '{}';
