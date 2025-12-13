-- Migration: Add Time to Visits
-- Adds time column to visits table for tracking appointment times
-- Date: 2025-12-13

BEGIN;

-- Add time column (TIME type stores just the time component)
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS time TIME;

-- Create index for querying by time
CREATE INDEX IF NOT EXISTS idx_visits_user_date_time ON visits(user_id, date, time);

COMMIT;

-- Migration complete!
-- Time is optional - existing visits will have NULL time
-- Format: HH:MM:SS (e.g., '14:30:00' for 2:30 PM)
