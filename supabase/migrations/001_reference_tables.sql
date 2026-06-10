-- ============================================================
-- Migration 001: Reference tables
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Islands
create table public.islands (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  outline_url text,
  display_order integer default 0
);

alter table public.islands enable row level security;
create policy "Islands viewable by everyone" on public.islands
  for select using (true);
create policy "Admin manages islands" on public.islands
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

insert into public.islands (name, outline_url, display_order) values
  ('Santorini',  'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/09772b00b_outline.png',    1),
  ('Mykonos',    'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/47d88f94d_image.png',      2),
  ('Crete',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/3abbf2af5_image.png',      3),
  ('Rhodes',     'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/5dbf47276_image.png',      4),
  ('Corfu',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/3776e27e7_image.png',      5),
  ('Zakynthos',  'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/4638acc8a_image.png',      6),
  ('Paros',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/a84ce17fd_image.png',      7),
  ('Naxos',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/a6e717364_image.png',      8),
  ('Lefkada',    'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/6f0b28779_lefkada_outline.webp', 9),
  ('Milos',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/c221afccd_milos_outline.webp',  10),
  ('Skiathos',   'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/f2e8b723a_skiathos_outline.webp', 11),
  ('Hydra',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/46a873750_image.png',      12),
  ('Ios',        'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/74cd88460_image.png',      13),
  ('Kefalonia',  'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/dc15de17b_image.png',      14),
  ('Samos',      'https://media.base44.com/images/public/69f7b607f372feaad608e5b5/cdc62bdff_image.png',      15);

-- Categories
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  display_order integer default 0
);

alter table public.categories enable row level security;
create policy "Categories viewable by everyone" on public.categories
  for select using (true);
create policy "Admin manages categories" on public.categories
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

insert into public.categories (key, display_order) values
  ('fine_dining',  1),
  ('wine_expert',  2),
  ('pool_beach',   3),
  ('breakfast',    4),
  ('banquet',      5),
  ('room_service', 6),
  ('head_waiter',  7),
  ('catering',     8);

-- Employment types
create table public.employment_types (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  display_order integer default 0
);

alter table public.employment_types enable row level security;
create policy "Employment types viewable by everyone" on public.employment_types
  for select using (true);
create policy "Admin manages employment types" on public.employment_types
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

insert into public.employment_types (key, display_order) values
  ('full_time',  1),
  ('part_time',  2),
  ('seasonal',   3),
  ('temporary',  4);
