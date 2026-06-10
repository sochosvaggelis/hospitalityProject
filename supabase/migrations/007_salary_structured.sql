-- Migration 007: Replace free-text salary_range with structured salary fields
alter table public.jobs
  add column salary_amount numeric,
  add column salary_period text check (salary_period in ('hourly', 'daily', 'monthly'));

alter table public.jobs drop column if exists salary_range;
