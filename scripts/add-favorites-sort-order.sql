-- Add sort_order column to favorites table for drag-and-drop reordering

ALTER TABLE favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing favorites to have sequential sort_order based on created_at
UPDATE favorites
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM favorites
) AS subquery
WHERE favorites.id = subquery.id;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_favorites_user_sort ON favorites(user_id, sort_order);
