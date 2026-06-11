ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('accepted', 'rejected', 'new_application'));

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS applicant_name text;
