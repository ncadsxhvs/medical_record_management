-- Favorite Groups: named templates of (hcpcs, quantity) entries
CREATE TABLE IF NOT EXISTS favorite_groups (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_favorite_groups_user_sort
  ON favorite_groups(user_id, sort_order);

CREATE TABLE IF NOT EXISTS favorite_group_items (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER NOT NULL REFERENCES favorite_groups(id) ON DELETE CASCADE,
  hcpcs      VARCHAR(20) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 1000),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(group_id, hcpcs)
);
CREATE INDEX IF NOT EXISTS idx_favorite_group_items_group
  ON favorite_group_items(group_id);
