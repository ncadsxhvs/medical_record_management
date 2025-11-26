-- Migration: Add Multi-HCPCS Support
-- Transforms single-procedure entries to multi-procedure visits
-- Date: 2025-11-25

BEGIN;

-- 1. Create new visits table (parent record for patient encounters)
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visits_user_id ON visits(user_id);
CREATE INDEX idx_visits_date ON visits(date);
CREATE INDEX idx_visits_user_date ON visits(user_id, date DESC);

-- 2. Create visit_procedures junction table
CREATE TABLE IF NOT EXISTS visit_procedures (
  id SERIAL PRIMARY KEY,
  visit_id INTEGER NOT NULL,
  hcpcs VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  status_code VARCHAR(50),
  work_rvu DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

CREATE INDEX idx_visit_procedures_visit_id ON visit_procedures(visit_id);
CREATE INDEX idx_visit_procedures_hcpcs ON visit_procedures(hcpcs);

-- 3. Create update trigger for visits table
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Migrate existing entries data
-- Each entry becomes a visit with one procedure
INSERT INTO visits (id, user_id, date, created_at, updated_at)
SELECT id, user_id, date, created_at, updated_at
FROM entries;

INSERT INTO visit_procedures (visit_id, hcpcs, description, status_code, work_rvu, created_at)
SELECT id, hcpcs, description, status_code, work_rvu, created_at
FROM entries;

-- 5. Update sequence to prevent ID conflicts
SELECT setval('visits_id_seq', (SELECT MAX(id) FROM visits) + 1);

-- 6. Rename old table for safety (keep as backup)
ALTER TABLE entries RENAME TO entries_backup;

-- 7. Create backwards-compatible view
CREATE VIEW entries AS
  SELECT
    vp.id,
    v.user_id,
    vp.hcpcs,
    vp.description,
    vp.status_code,
    vp.work_rvu,
    v.date,
    v.created_at,
    v.updated_at
  FROM visits v
  JOIN visit_procedures vp ON v.id = vp.visit_id;

COMMIT;

-- Migration complete!
-- The entries_backup table can be dropped after 30 days if everything works correctly
-- To rollback: DROP TABLE visits CASCADE; DROP TABLE visit_procedures CASCADE; ALTER TABLE entries_backup RENAME TO entries;
