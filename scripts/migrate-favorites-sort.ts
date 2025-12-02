import { sql } from '../src/lib/db';

async function migrate() {
  try {
    console.log('Adding sort_order column to favorites table...');

    // Add column
    await sql`
      ALTER TABLE favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `;

    console.log('Updating existing favorites with sequential sort_order...');

    // Update existing favorites to have sequential sort_order
    await sql`
      UPDATE favorites
      SET sort_order = subquery.row_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
        FROM favorites
      ) AS subquery
      WHERE favorites.id = subquery.id
    `;

    console.log('Creating index...');

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_favorites_user_sort ON favorites(user_id, sort_order)
    `;

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
