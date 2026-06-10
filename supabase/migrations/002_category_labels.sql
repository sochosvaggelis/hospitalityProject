-- Migration 002: Add label columns to categories and employment_types

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS label_en text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS label_el text;

UPDATE public.categories SET label_en = 'Fine Dining',              label_el = 'Fine Dining'                  WHERE key = 'fine_dining';
UPDATE public.categories SET label_en = 'Wine Expert / Sommelier',  label_el = 'Οινολόγος / Sommelier'        WHERE key = 'wine_expert';
UPDATE public.categories SET label_en = 'Pool & Beach Server',      label_el = 'Pool & Beach Server'          WHERE key = 'pool_beach';
UPDATE public.categories SET label_en = 'Breakfast Server',         label_el = 'Σερβιτόρος Πρωινού'           WHERE key = 'breakfast';
UPDATE public.categories SET label_en = 'Banquet Server',           label_el = 'Σερβιτόρος Δεξιώσεων'        WHERE key = 'banquet';
UPDATE public.categories SET label_en = 'Room Service',             label_el = 'Room Service'                  WHERE key = 'room_service';
UPDATE public.categories SET label_en = 'Head Waiter / Maître d''', label_el = 'Αρχισερβιτόρος / Maître d''' WHERE key = 'head_waiter';
UPDATE public.categories SET label_en = 'Catering Server',          label_el = 'Σερβιτόρος Catering'         WHERE key = 'catering';

ALTER TABLE public.employment_types ADD COLUMN IF NOT EXISTS label_en text;
ALTER TABLE public.employment_types ADD COLUMN IF NOT EXISTS label_el text;

UPDATE public.employment_types SET label_en = 'Full Time',   label_el = 'Πλήρης Απασχόληση'  WHERE key = 'full_time';
UPDATE public.employment_types SET label_en = 'Part Time',   label_el = 'Μερική Απασχόληση'  WHERE key = 'part_time';
UPDATE public.employment_types SET label_en = 'Seasonal',    label_el = 'Εποχιακή'            WHERE key = 'seasonal';
UPDATE public.employment_types SET label_en = 'Temporary',   label_el = 'Προσωρινή'           WHERE key = 'temporary';
