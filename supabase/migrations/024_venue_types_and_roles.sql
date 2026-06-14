-- Phase 2a: venue types (café / hotel / restaurant / bar / beach bar) and a
-- broadened, data-driven role catalog tagged by which venue types each role
-- applies to. The categories table becomes the single source of truth, so new
-- roles or new type tags are just inserts/updates — no code or constraint change.

-- 1) Venue types reference table -------------------------------------------------
create table if not exists public.venue_types (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  label_en text,
  label_el text,
  display_order integer default 0
);

alter table public.venue_types enable row level security;
do $$ begin
  create policy "Venue types viewable by everyone" on public.venue_types for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Admin manages venue types" on public.venue_types for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object then null; end $$;

insert into public.venue_types (key, label_en, label_el, display_order) values
  ('hotel',      'Hotel',      'Ξενοδοχείο', 1),
  ('restaurant', 'Restaurant', 'Εστιατόριο', 2),
  ('cafe',       'Café',       'Καφέ',       3),
  ('bar',        'Bar',        'Μπαρ',       4),
  ('beach_bar',  'Beach Bar',  'Beach Bar',  5)
on conflict (key) do nothing;

-- 2) Venues get a type ----------------------------------------------------------
alter table public.venues add column if not exists type text;

-- 3) Tag each role with the venue types it applies to ---------------------------
alter table public.categories add column if not exists venue_types text[];

update public.categories set venue_types = array['restaurant','hotel']                       where key = 'fine_dining';
update public.categories set venue_types = array['restaurant','hotel','bar']                  where key = 'wine_expert';
update public.categories set venue_types = array['hotel','beach_bar']                         where key = 'pool_beach';
update public.categories set venue_types = array['hotel','cafe']                              where key = 'breakfast';
update public.categories set venue_types = array['hotel','restaurant']                        where key = 'banquet';
update public.categories set venue_types = array['hotel']                                     where key = 'room_service';
update public.categories set venue_types = array['restaurant','hotel']                        where key = 'head_waiter';
update public.categories set venue_types = array['restaurant','hotel']                        where key = 'catering';

-- 4) New roles across the broader set of venue types ----------------------------
insert into public.categories (key, label_en, label_el, display_order, venue_types) values
  ('waiter',           'Waiter / Waitress',  'Σερβιτόρος/α',        20, array['restaurant','cafe','bar','beach_bar','hotel']),
  ('barista',          'Barista',            'Barista',             21, array['cafe','bar','hotel']),
  ('bartender',        'Bartender',          'Bartender',           22, array['bar','cafe','restaurant','beach_bar','hotel']),
  ('host',             'Host / Hostess',     'Host / Hostess',      23, array['restaurant','bar','hotel']),
  ('cashier',          'Cashier',            'Ταμίας',              24, array['cafe','restaurant','bar']),
  ('chef',             'Chef / Cook',        'Μάγειρας',            25, array['restaurant','hotel']),
  ('kitchen_assistant','Kitchen Assistant',  'Βοηθός Κουζίνας',     26, array['restaurant','cafe','hotel']),
  ('dishwasher',       'Dishwasher',         'Λαντζιέρης',          27, array['restaurant','hotel']),
  ('receptionist',     'Receptionist',       'Ρεσεψιονίστ',         28, array['hotel']),
  ('housekeeping',     'Housekeeping',       'Καμαριέρα/ης',        29, array['hotel']),
  ('concierge',        'Concierge',          'Concierge',           30, array['hotel']),
  ('porter',           'Porter / Bellboy',   'Πορτιέρης',           31, array['hotel'])
on conflict (key) do nothing;

-- 5) Drop the rigid check so the categories table alone governs valid roles -----
alter table public.jobs drop constraint if exists jobs_category_check;
