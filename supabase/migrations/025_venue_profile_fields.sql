-- Venues are independent businesses (e.g. a McDonald's and a Starbucks under one
-- owner account), so each carries its own public identity rather than sharing the
-- account's. Add the per-venue profile fields.
alter table public.venues add column if not exists stars integer;
alter table public.venues add column if not exists website text;
alter table public.venues add column if not exists description text;

-- Preserve existing data: the auto-created venue (one per account) inherits the
-- account's current stars/website/description/logo so nothing is lost.
update public.venues v
set stars       = coalesce(v.stars, p.hotel_stars),
    website     = coalesce(v.website, p.hotel_website),
    description = coalesce(v.description, p.hotel_description),
    logo_url    = coalesce(v.logo_url, p.hotel_logo_url)
from public.profiles p
where p.id = v.owner_user_id;
