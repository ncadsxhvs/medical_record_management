-- Add updated_at column to favorites table for iOS compatibility
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill updated_at with created_at for existing rows
UPDATE favorites SET updated_at = created_at WHERE updated_at IS NULL;
