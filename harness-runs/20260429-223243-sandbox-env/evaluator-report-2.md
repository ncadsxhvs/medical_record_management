# Evaluator Report 2 -- Sandbox Environment

**Date:** 2026-04-29  
**Evaluator:** Adversarial QA, iteration 2

---

## BUG-1 Fix Verification: Idempotent Re-runs

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| `npm run sandbox:reset` (clean slate) | 9 visits, 12 procedures | 9 visits, 12 procedures | PASS |
| Re-run `bash scripts/sandbox-up.sh` (no reset) | Skips seeding, counts unchanged | "Test data already exists (9 visits). Skipping." | PASS |
| Visits after re-run | 9 | 9 | PASS |
| Procedures after re-run | 12 | 12 | PASS |
| Favorites after re-run | 4 | 4 | PASS |
| Groups after re-run | 1 | 1 | PASS |

**Mechanism:** Lines 65-71 check `SELECT count(*) FROM visits WHERE user_id='sandbox-user'` and skip the entire seed block if > 0. Additionally, favorites use `ON CONFLICT DO NOTHING` and RVU codes use `ON CONFLICT DO UPDATE` for extra safety.

**VERDICT: BUG-1 FIX CONFIRMED**

---

## BUG-2 Fix Verification: Portable Date Arithmetic

| Check | Result |
|-------|--------|
| `portable_date_ago()` function exists (lines 52-58) | YES |
| macOS branch (`date -v`) present | YES |
| Linux branch (`date -d`) present | YES |
| `portable_date_ago 3` returns correct date on macOS | 2026-04-26 (correct, 3 days before 2026-04-29) |

**VERDICT: BUG-2 FIX CONFIRMED**

---

## Original Acceptance Criteria Re-verification

| Criterion | Status |
|-----------|--------|
| `scripts/add-visit-procedure-quantity.sql` exists | PASS |
| Migration loop includes it (line 29) | PASS |
| No inline ALTER TABLE hack in sandbox-up.sh | PASS (ALTER comes from the migration file) |
| `scripts/seed-test-data.ts` does NOT exist | PASS |
| RVU codes loaded: 16852 | PASS |
| 9 visits | PASS |
| 12 procedures | PASS |
| 4 favorites | PASS |
| 1 favorite group | PASS |

---

## Additional Adversarial Checks

### Docker not running
`set -euo pipefail` on line 2 means the script exits immediately on any error. If Docker is not running, `docker compose up -d` fails and the script aborts with a non-zero exit code. This is acceptable fail-fast behavior.

### RVU \copy on re-run
Uses a TEMP TABLE (`rvu_staging`) which is dropped at session end, plus `ON CONFLICT ... DO UPDATE`. Re-runs are fully safe -- confirmed by the second run completing without errors and still showing 16852 codes.

---

## VERDICT: PASS

Both bugs are fixed. All acceptance criteria met. Script is idempotent and cross-platform.

---

## Three Things NOT Tested

1. **Linux platform execution** -- `portable_date_ago()` Linux branch (`date -d`) was only verified by code review, not by running on an actual Linux host.
2. **Concurrent re-runs** -- Did not test what happens if two `sandbox-up.sh` invocations run simultaneously (race condition on the idempotency check).
3. **`npm run dev:sandbox`** -- Did not start the dev server and verify the seeded data renders correctly in the UI.
