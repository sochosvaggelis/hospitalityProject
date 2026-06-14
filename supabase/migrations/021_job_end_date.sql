-- End of the job's informative date range (start_date is the range start).
-- Both dates are display-only and never affect listing visibility.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS end_date text;
