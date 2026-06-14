-- Focal point for the job photo, stored as a CSS object-position value (e.g. "50% 30%").
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS photo_position text;
