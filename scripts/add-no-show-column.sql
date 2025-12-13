-- Migration: Add No-Show Support to Visits
-- Adds is_no_show column to visits table
-- Date: 2025-12-12

BEGIN;

-- Add is_no_show column to visits table
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS is_no_show BOOLEAN DEFAULT FALSE;

-- Create index for querying no-show visits
CREATE INDEX IF NOT EXISTS idx_visits_no_show ON visits(user_id, is_no_show);

COMMIT;

-- Migration complete!
-- No-show visits can now be tracked with is_no_show = TRUE and empty procedures
