-- Unify job-seeker favourites on the venue model. The old 'hotel' kind pointed
-- at an account-level profile (profiles.id) which the venue migration retired;
-- those rows can no longer render, so we drop them and switch the kind to 'venue'
-- (ref_id now = venues.id).
delete from public.user_favorites where kind = 'hotel';

alter table public.user_favorites drop constraint if exists user_favorites_kind_check;
alter table public.user_favorites
  add constraint user_favorites_kind_check check (kind in ('venue', 'job'));
