-- RVU Tracker Database Schema

-- RVU Codes Table (master data from RVU.csv)
CREATE TABLE IF NOT EXISTS rvu_codes (
  id SERIAL PRIMARY KEY,
  hcpcs VARCHAR(20) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  status_code VARCHAR(50),
  work_rvu DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rvu_codes_hcpcs ON rvu_codes(hcpcs);
CREATE INDEX IF NOT EXISTS idx_rvu_codes_description ON rvu_codes USING gin(to_tsvector('english', description));

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Google's unique user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entries Table (user data)
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  hcpcs VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  status_code VARCHAR(50),
  work_rvu DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_hcpcs ON entries(hcpcs);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date DESC);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  hcpcs VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, hcpcs)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Update trigger for entries
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
