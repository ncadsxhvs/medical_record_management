-- Migration: Add foreign keys, check constraints, and missing indexes
-- Date: 2026-05-05

-- P1: Foreign keys on user_id columns (ON DELETE CASCADE)
-- Clean up any orphaned records first
DELETE FROM visits WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM favorites WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM favorite_groups WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM custom_codes WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM user_settings WHERE user_id NOT IN (SELECT id FROM users);

ALTER TABLE visits
  ADD CONSTRAINT fk_visits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE favorites
  ADD CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE favorite_groups
  ADD CONSTRAINT fk_favorite_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE custom_codes
  ADD CONSTRAINT fk_custom_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_settings
  ADD CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- P2: Check constraints
ALTER TABLE visit_procedures
  ADD CONSTRAINT chk_visit_procedures_quantity CHECK (quantity BETWEEN 1 AND 1000);

ALTER TABLE user_settings
  ADD CONSTRAINT chk_user_settings_date_range CHECK (target_end_date IS NULL OR target_start_date IS NULL OR target_end_date >= target_start_date);

ALTER TABLE custom_codes
  ALTER COLUMN hcpcs TYPE VARCHAR(20);

-- P3: Missing indexes
CREATE INDEX IF NOT EXISTS idx_favorite_group_items_group_sort ON favorite_group_items(group_id, sort_order);
