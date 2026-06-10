-- Migration 008: Add Greek title field to jobs
alter table public.jobs add column title_el text;
