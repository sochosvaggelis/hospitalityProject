-- Whether the listed salary is open to negotiation. Shown as a badge on the job
-- post next to the salary.
alter table public.jobs
  add column if not exists salary_negotiable boolean not null default false;
