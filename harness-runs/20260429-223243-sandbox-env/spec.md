# Spec: Fix TrackMyRVU Local Docker Sandbox

## Overview
The sandbox lets developers run TrackMyRVU against a local Docker Postgres instead of the remote Neon database. Four issues need fixing.

## Changes Required

### 2A. Create migration file `scripts/add-visit-procedure-quantity.sql`
This migration is missing from source control. The `quantity` column exists in the remote DB but was never captured as a migration file.

```sql
ALTER TABLE visit_procedures ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
```

### 2B. Update `scripts/sandbox-up.sh`
- Add `add-visit-procedure-quantity.sql` to the migration loop (after `add-favorite-groups.sql`)
- Remove the inline `ALTER TABLE` block ("Adding quantity column" echo + docker exec command)

### 2C. Delete `scripts/seed-test-data.ts`
This file uses `@vercel/postgres` and cannot connect to local Postgres. Superseded by inline SQL in `sandbox-up.sh`.

### 2D. Verify `start-sbx.sh`
Already handles lock cleanup correctly. No changes needed. Confirm it kills port 3001, removes `.next/dev/lock`, copies env, starts dev server.

## File-by-File Changes

| File | Action |
|---|---|
| `scripts/add-visit-procedure-quantity.sql` | CREATE |
| `scripts/sandbox-up.sh` | EDIT — add migration to loop, remove inline ALTER TABLE |
| `scripts/seed-test-data.ts` | DELETE |
| `start-sbx.sh` | No change (verify only) |

## Acceptance Criteria

1. `scripts/add-visit-procedure-quantity.sql` exists with correct ALTER TABLE
2. `scripts/sandbox-up.sh` migration loop includes `add-visit-procedure-quantity.sql`
3. `scripts/sandbox-up.sh` has NO inline ALTER TABLE for quantity outside the migration
4. `scripts/seed-test-data.ts` does not exist
5. No file in `scripts/` imports from `@vercel/postgres` (seed-rvu.ts was already fixed)
6. `sandbox-up.sh` still contains inline SQL seed data (INSERT INTO users, visits, etc.)
7. End-to-end: `npm run sandbox:reset` completes; quantity column exists; 9 visits seeded; 12 procedures seeded
