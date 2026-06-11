CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email text NOT NULL,
    type text NOT NULL CHECK (type IN ('accepted', 'rejected')),
    job_title text NOT NULL,
    hotel_name text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_email_idx ON notifications(user_email);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
