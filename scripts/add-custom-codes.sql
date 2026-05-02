-- Migration: Add custom_codes table for user-defined HCPCS codes
CREATE TABLE IF NOT EXISTS custom_codes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  hcpcs TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  work_rvu NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, hcpcs)
);

CREATE INDEX IF NOT EXISTS idx_custom_codes_user ON custom_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_codes_hcpcs ON custom_codes(hcpcs);
