#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONTAINER=trackmyrvu-db
DB_URL="postgresql://trackmyrvu:localdev@localhost:5433/trackmyrvu"

echo "==> Starting Postgres container..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d

echo "==> Waiting for Postgres to be ready..."
until docker exec $CONTAINER pg_isready -U trackmyrvu > /dev/null 2>&1; do
  sleep 1
done
echo "    Postgres is ready."

echo "==> Running init-db.sql..."
docker exec -i $CONTAINER psql -U trackmyrvu -d trackmyrvu < "$SCRIPT_DIR/init-db.sql"

echo "==> Running migrations in order..."
for migration in \
  migrate-to-multi-hcpcs.sql \
  add-favorites-sort-order.sql \
  add-no-show-column.sql \
  add-visit-time.sql \
  add-favorites-updated-at.sql \
  add-favorite-groups.sql \
  add-visit-procedure-quantity.sql; do
  if [ -f "$SCRIPT_DIR/$migration" ]; then
    echo "    $migration"
    docker exec -i $CONTAINER psql -U trackmyrvu -d trackmyrvu < "$SCRIPT_DIR/$migration"
  else
    echo "    $migration (skipped — not found)"
  fi
done

echo "==> Seeding RVU codes (16,852 codes from RVU.csv)..."
docker cp "$PROJECT_DIR/data/RVU.csv" $CONTAINER:/tmp/RVU.csv
docker exec -i $CONTAINER psql -U trackmyrvu -d trackmyrvu <<'SQL'
CREATE TEMP TABLE rvu_staging (hcpcs VARCHAR(20), description TEXT, status_code VARCHAR(50), work_rvu DECIMAL(10,2));
\copy rvu_staging FROM '/tmp/RVU.csv' DELIMITER ',' CSV HEADER
INSERT INTO rvu_codes (hcpcs, description, status_code, work_rvu)
SELECT DISTINCT ON (hcpcs) hcpcs, description, status_code, work_rvu FROM rvu_staging
ON CONFLICT (hcpcs) DO UPDATE SET description=EXCLUDED.description, status_code=EXCLUDED.status_code, work_rvu=EXCLUDED.work_rvu;
SQL
echo "    $(docker exec -i $CONTAINER psql -U trackmyrvu -d trackmyrvu -t -c 'SELECT count(*) FROM rvu_codes;' | tr -d ' ') codes loaded"

echo "==> Seeding test data (sandbox user, visits, favorites)..."

# Portable date arithmetic (works on both macOS and Linux)
portable_date_ago() {
  local days_ago=$1
  if date -v-1d +%Y-%m-%d > /dev/null 2>&1; then
    date -v-${days_ago}d +%Y-%m-%d
  else
    date -d "-${days_ago} days" +%Y-%m-%d
  fi
}

TODAY=$(date +%Y-%m-%d)
D1=$(portable_date_ago 1); D2=$(portable_date_ago 2); D3=$(portable_date_ago 3)
D4=$(portable_date_ago 4); D5=$(portable_date_ago 5); D6=$(portable_date_ago 6)

# Skip seeding if sandbox user visits already exist (idempotent re-runs)
EXISTING=$(docker exec -i $CONTAINER psql -U trackmyrvu -d trackmyrvu -t -c \
  "SELECT count(*) FROM visits WHERE user_id='sandbox-user';" | tr -d ' ')

if [ "$EXISTING" -gt 0 ]; then
  echo "    Test data already exists ($EXISTING visits). Skipping."
else
  docker exec -i $CONTAINER psql -U trackmyrvu -d trackmyrvu <<SQL
INSERT INTO users (id, email, name) VALUES ('sandbox-user', 'sandbox@localhost', 'Sandbox User') ON CONFLICT (id) DO NOTHING;

INSERT INTO visits (user_id, date, time, notes, is_no_show) VALUES
  ('sandbox-user', '$TODAY', '09:15', NULL, false),
  ('sandbox-user', '$TODAY', '11:30', NULL, false),
  ('sandbox-user', '$D1', '08:45', NULL, false),
  ('sandbox-user', '$D1', '14:00', NULL, false),
  ('sandbox-user', '$D2', '10:00', NULL, false),
  ('sandbox-user', '$D3', '09:00', 'Patient did not show', true),
  ('sandbox-user', '$D4', '13:30', NULL, false),
  ('sandbox-user', '$D5', '08:00', NULL, false),
  ('sandbox-user', '$D6', '11:00', NULL, false);

INSERT INTO visit_procedures (visit_id, hcpcs, description, status_code, work_rvu, quantity)
SELECT v.id, p.hcpcs, p.description, p.status_code, p.work_rvu, p.quantity
FROM (VALUES
  (1,'99214','Office visit, est patient, moderate','A',1.92,1),
  (1,'99213','Office visit, est patient, low','A',1.30,1),
  (2,'99215','Office visit, est patient, high','A',2.80,1),
  (3,'99203','Office visit, new patient, low','A',1.60,1),
  (3,'99214','Office visit, est patient, moderate','A',1.92,2),
  (4,'99232','Subsequent hospital care, moderate','A',1.39,3),
  (5,'99213','Office visit, est patient, low','A',1.30,2),
  (7,'99214','Office visit, est patient, moderate','A',1.92,1),
  (7,'99213','Office visit, est patient, low','A',1.30,1),
  (7,'99232','Subsequent hospital care, moderate','A',1.39,1),
  (8,'99215','Office visit, est patient, high','A',2.80,1),
  (9,'99203','Office visit, new patient, low','A',1.60,1)
) AS p(visit_num, hcpcs, description, status_code, work_rvu, quantity)
JOIN visits v ON v.id = (SELECT id FROM visits WHERE user_id='sandbox-user' ORDER BY id LIMIT 1 OFFSET p.visit_num - 1);

INSERT INTO favorites (user_id, hcpcs, sort_order) VALUES
  ('sandbox-user','99213',0),('sandbox-user','99214',1),('sandbox-user','99215',2),('sandbox-user','99203',3)
ON CONFLICT (user_id, hcpcs) DO NOTHING;

INSERT INTO favorite_groups (user_id, name, sort_order) VALUES ('sandbox-user', 'Follow-Up Visit', 0) ON CONFLICT (user_id, name) DO NOTHING;
INSERT INTO favorite_group_items (group_id, hcpcs, quantity, sort_order)
  SELECT g.id, v.hcpcs, v.qty, v.ord FROM favorite_groups g,
  (VALUES ('99214',1,0),('99213',2,1)) AS v(hcpcs, qty, ord)
  WHERE g.name='Follow-Up Visit' AND g.user_id='sandbox-user'
ON CONFLICT (group_id, hcpcs) DO NOTHING;
SQL
fi

echo ""
echo "Done! Start the app with:"
echo "  npm run dev:sandbox"
