-- Migration: Add quantity column to visit_procedures
-- This column was added manually to production but never captured in a migration.
ALTER TABLE visit_procedures ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
