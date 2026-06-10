-- Migration 009: Add listing language field to jobs
alter table public.jobs
  add column listing_lang text default 'en' check (listing_lang in ('en', 'el', 'both'));
