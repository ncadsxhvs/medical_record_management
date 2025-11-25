import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

async function seedRVUData() {
  console.log('Starting RVU data seeding...');

  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'data', 'RVU.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    // Skip header
    const dataLines = lines.slice(1).filter(line => line.trim());

    console.log(`Found ${dataLines.length} RVU codes to insert`);

    // Batch insert for performance
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);

      const values: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const line of batch) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const hcpcs = parts[0].trim();
          const description = parts[1].trim();
          const statusCode = parts[2].trim();
          const workRvu = parseFloat(parts[3].trim()) || 0;

          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
          params.push(hcpcs, description, statusCode, workRvu);
          paramIndex += 4;
        }
      }

      if (values.length > 0) {
        const query = `
          INSERT INTO rvu_codes (hcpcs, description, status_code, work_rvu)
          VALUES ${values.join(', ')}
          ON CONFLICT (hcpcs) DO UPDATE SET
            description = EXCLUDED.description,
            status_code = EXCLUDED.status_code,
            work_rvu = EXCLUDED.work_rvu
        `;

        await sql.query(query, params);
        inserted += values.length;
        console.log(`Inserted ${inserted}/${dataLines.length} codes...`);
      }
    }

    console.log(`✅ Successfully seeded ${inserted} RVU codes!`);
  } catch (error) {
    console.error('❌ Error seeding RVU data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedRVUData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedRVUData };
