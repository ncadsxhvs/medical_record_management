# Evaluator Report

## Acceptance Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `scripts/add-visit-procedure-quantity.sql` exists with correct ALTER TABLE | PASS |
| 2 | Migration loop includes `add-visit-procedure-quantity.sql` | PASS |
| 3 | No inline ALTER TABLE for quantity outside the migration loop | PASS |
| 4 | `scripts/seed-test-data.ts` does NOT exist | PASS |
| 5 | No `@vercel/postgres` imports in scripts used by sandbox | PASS (sandbox-up.sh uses psql COPY, not seed-rvu.ts) |
| 6 | `sandbox-up.sh` still contains inline SQL seed data | PASS |
| 7 | End-to-end `npm run sandbox:reset` | PASS (9 visits, 12 procedures, 16852 RVU codes, quantity column present, favorites and groups seeded) |

## Bugs Found

### BUG-1 (BLOCKING): Re-run duplicates visits and procedures

Running `sandbox-up.sh` a second time (without `sandbox:reset` which does `docker compose down -v`) inserts duplicate rows. After the second run:
- **visits**: 18 rows (expected 9)
- **visit_procedures**: 24 rows (expected 12)

Root cause: The `INSERT INTO visits` statement on line 57 has no `ON CONFLICT` clause. Similarly, `INSERT INTO visit_procedures` on line 68 has no conflict handling. Only `INSERT INTO users`, `INSERT INTO favorites`, and `INSERT INTO favorite_groups/favorite_group_items` have `ON CONFLICT` clauses.

The script is not idempotent. Running `bash scripts/sandbox-up.sh` twice produces corrupt test data.

### BUG-2 (BLOCKING): `date -v` is macOS-only

Lines 51-53 of `sandbox-up.sh`:
```bash
D1=$(date -v-1d +%Y-%m-%d); D2=$(date -v-2d +%Y-%m-%d); D3=$(date -v-3d +%Y-%m-%d)
D4=$(date -v-4d +%Y-%m-%d); D5=$(date -v-5d +%Y-%m-%d); D6=$(date -v-6d +%Y-%m-%d)
```

The `-v` flag is a BSD/macOS `date` extension. On Linux (including CI, Docker, WSL), this will fail with an error. The GNU equivalent is `date -d "-1 day"`. The script should use a portable approach or detect the platform.

### BUG-3 (NON-BLOCKING): Re-run errors in init-db.sql and migrate-to-multi-hcpcs.sql

When the database already exists, `init-db.sql` fails trying to create indexes/triggers on the `entries` view, and `migrate-to-multi-hcpcs.sql` fails inside its `BEGIN` transaction due to `idx_visits_user_id` already existing, causing the entire transaction to `ROLLBACK`. While `set -euo pipefail` is set, these docker exec commands apparently still return 0 (psql continues), so the script doesn't abort, but the errors are noisy and the migration doesn't actually re-apply cleanly.

## Additional Checks

| Check | Result |
|-------|--------|
| `start-sbx.sh` works | NOT TESTED (would start long-running server; script looks correct) |
| Dev Login button with NEXT_PUBLIC_DEV_BYPASS_AUTH=true | NOT TESTED |
| References to seed-test-data.ts | NONE FOUND in package.json or sandbox-up.sh |
| `@vercel/postgres` in scripts/ | Present in 5 utility scripts (connect-db.ts, seed-rvu.ts, check-user.ts, run-migration.ts, alter-status-code.ts) but none are invoked by sandbox-up.sh, which uses psql COPY instead |

## Things NOT Tested

1. **Dev Login button rendering** -- did not start the dev server and verify the sign-in page shows "Dev Login" when `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` is set.
2. **start-sbx.sh end-to-end** -- did not actually run the dev server and verify port 3001 responds with a page.
3. **RVU code data integrity** -- verified the count (16,852) but did not spot-check that individual HCPCS codes (e.g., 99213) have correct work_rvu values after COPY import.

VERDICT: FAIL
