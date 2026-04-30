# Generator Log — Iteration 1

## Changes Made
1. Created `scripts/add-visit-procedure-quantity.sql` — proper migration for the missing column
2. Updated `scripts/sandbox-up.sh` — added migration to loop, removed inline ALTER TABLE hack
3. Deleted `scripts/seed-test-data.ts` — used @vercel/postgres, can't connect to local Postgres
4. Verified `start-sbx.sh` — already correct (kills port, removes lock, copies env, starts dev)

## Self-Checks
- `npm run build` — PASS
- `npm test` — 80/80 PASS (1 suite fail is pre-existing Playwright/Jest conflict)
- No `@vercel/postgres` imports in `scripts/` (seed-rvu.ts still has it but is unused by sandbox-up.sh)
- Inline SQL seed data preserved in sandbox-up.sh
