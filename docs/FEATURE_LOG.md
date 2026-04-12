# Feature Log

Append-only log of implemented features. Newest first.

---

## Entry 19

- **Date:** 2026-04-11
- **Title:** feat(favorites): Edit, rename, and delete favorite groups
- **Branch:** `feat/update-fav-group`
- **What changed:**
  - Always-visible edit (pencil), rename, and delete (trash) action icons on each group tile
  - Edit loads group procedures into the form with a blue "Editing group" banner and Update/Cancel buttons
  - Rename prompts for a new name with duplicate-name validation (409 conflict)
  - Delete confirms before removing
  - Unsaved-changes warning when editing over existing procedures in the form
  - Editing state clears on form clear or visit save
- **Files touched:**
  - `src/components/FavoriteGroupsPicker.tsx` (action icons, rename handler, edit highlight)
  - `src/components/EntryForm.tsx` (edit/update/cancel handlers, editing banner, state cleanup)
- **Risk/Notes:** No schema or API changes — uses existing `PUT /api/favorite-groups/{id}` and `DELETE` endpoints.
- **How to verify:** Sign in, create a group, verify edit/rename/delete icons appear on tile. Edit a group, modify procedures, tap Update. Rename with a duplicate name and verify error. Delete and confirm removal.

## Entry 18

- **Date:** 2026-04-07
- **Title:** feat(favorites): Add Favorite Groups (named HCPCS + quantity templates)
- **Branch:** `feat/code-group`
- **What changed:**
  - New `favorite_groups` and `favorite_group_items` tables (migration: `scripts/add-favorite-groups.sql`)
  - New API: `GET/POST/PATCH /api/favorite-groups` and `PUT/DELETE /api/favorite-groups/{id}`
  - New `FavoriteGroupsPicker` component above the search/favorites pickers in the visit form
  - "Save as group" button on the visit form persists current procedures (with quantities) as a named template
  - Merge semantics on add: skip codes already on the visit, append the rest with their saved quantities
  - Coexists with existing single-code favorites (no changes to `favorites` table or `FavoritesPicker`)
- **Files touched:**
  - `scripts/add-favorite-groups.sql` (new)
  - `src/app/api/favorite-groups/route.ts` (new)
  - `src/app/api/favorite-groups/[id]/route.ts` (new)
  - `src/components/FavoriteGroupsPicker.tsx` (new)
  - `src/components/EntryForm.tsx` (mount picker, save-as-group handler)
  - `src/lib/procedureUtils.ts` (`groupItemsToProcedures`)
  - `src/lib/cache-keys.ts`, `src/types/index.ts`
- **Risk/Notes:** Requires running the migration before deploy. New tables only — no changes to existing schemas.
- **How to verify:** Apply migration, sign in, add 3 codes with quantities, tap "Save as group", clear form, tap the new group tile and confirm all 3 codes reappear with original quantities; tap again to verify the "already on this visit" alert.

## Entry 17

- **Date:** 2026-04-01
- **Title:** feat(analytics): Add Bonus Projection panel with custom target period
- **Branch:** `feat/rvu-target`
- **What changed:**
  - New `BonusProjection` collapsible panel on the Analytics dashboard
  - Inputs: RVU target, custom target period (two date pickers), bonus rate ($/RVU)
  - Calculates annualized pace, surplus over target, full-year projected bonus, and prorated period bonus
  - Progress bar showing % of annual target
  - Settings persisted to `localStorage` (with migration from any legacy format)
- **Files touched:**
  - `src/components/analytics/BonusProjection.tsx` (new)
  - `src/app/analytics/page.tsx` (integration after `<SummaryStats>`)
- **Risk/Notes:** Frontend-only; no schema or API changes
- **How to verify:** `npm run build` passes, `npm test` (80 passing); visit `/analytics`, expand "Bonus Projection", set target/dates/rate and confirm the projection cards update

## Entry 16

- **Date:** 2026-02-21
- **Title:** feat(api): Add DELETE /api/user endpoint for account deletion
- **Commits:** 586dacb (Add DELETE /api/user endpoint for account deletion)
- **What changed:**
  - New API endpoint allowing users to delete their account
- **Files touched:** `src/app/api/user/route.ts`
- **Risk/Notes:** Breaking change for users — account deletion is irreversible
- **How to verify:** `curl -X DELETE /api/user` with valid session; confirm user data removed from database

## Entry 15

- **Date:** 2026-02-21
- **Title:** fix(security): Security hardening for API routes
- **Commits:** 4e1559e (security update 1)
- **What changed:**
  - Input validation/sanitization on RVU search, visits, and visit detail API routes
  - Added mobile auth library
  - Updated Claude skills and rules
- **Files touched:** `src/app/api/rvu/search/route.ts`, `src/app/api/visits/[id]/route.ts`, `src/app/api/visits/route.ts`, `src/lib/mobile-auth.ts`
- **Risk/Notes:** API behavior changes — stricter validation may reject previously accepted inputs
- **How to verify:** `npm run build` passes; test API endpoints with edge-case inputs

## Entry 14

- **Date:** 2026-02-18
- **Title:** feat(app): Add privacy policy page
- **Commits:** b657bc6 (add privacy)
- **What changed:**
  - Added privacy policy page at `/privacy`
- **Files touched:** `src/app/privacy/page.tsx`
- **Risk/Notes:** None
- **How to verify:** Visit `/privacy` in browser

## Entry 13

- **Date:** 2026-02-17
- **Title:** feat(auth): Add Apple Sign-In support
- **Commits:** e83cde4 (add apple sign in), b33eccb (add fix)
- **What changed:**
  - New mobile auth endpoints for Apple and Google sign-in
  - Auth token utility library
  - OpenAPI spec updates
- **Files touched:** `src/app/api/auth/mobile/apple/route.ts`, `src/app/api/auth/mobile/google/route.ts`, `src/lib/auth-token.ts`, `docs/openapi.yaml`, `public/openapi.yaml`
- **Risk/Notes:** Requires Apple developer credentials configured. New env vars may be needed.
- **How to verify:** Test Apple sign-in flow on iOS; verify `/api/auth/mobile/apple` returns token

## Entry 12

- **Date:** 2026-02-14
- **Title:** refactor(api): Major API refactor for mobile/iOS support
- **Commits:** bb88f0e (refactor)
- **What changed:**
  - Refactored all API routes (analytics, entries, favorites, visits) for mobile compatibility
  - Added iOS API documentation and specs
  - Updated main page and analytics page
- **Files touched:** `src/app/api/analytics/route.ts`, `src/app/api/entries/route.ts`, `src/app/api/favorites/route.ts`, `src/app/api/favorites/reorder/route.ts`, `src/app/(main)/page.tsx`, `src/app/analytics/page.tsx`
- **Risk/Notes:** Broad API changes — verify all endpoints still work for web clients
- **How to verify:** `npm run build`; test all CRUD operations on visits, favorites, analytics

## Entry 11

- **Date:** 2026-02-11
- **Title:** feat(api): Enhanced analytics API and favorites endpoints
- **Commits:** 0c49b32 (add analytics api)
- **What changed:**
  - Enhanced analytics API route
  - Updated favorites reorder and CRUD endpoints
  - Added favorites test suite
  - Added favorites `updated_at` migration
- **Files touched:** `src/app/api/analytics/route.ts`, `src/app/api/favorites/reorder/route.ts`, `src/app/api/favorites/route.ts`, `src/app/api/__tests__/favorites.test.ts`, `scripts/add-favorites-updated-at.sql`
- **Risk/Notes:** Database migration required: `scripts/add-favorites-updated-at.sql`
- **How to verify:** `npm test`; test favorites CRUD and reorder via API

## Entry 10

- **Date:** 2026-02-05
- **Title:** feat(auth): Add mobile JWT authentication layer
- **Commits:** e6ec606 (add auth api)
- **What changed:**
  - Mobile auth middleware for JWT-based API access
  - Updated all API routes to support both session and token auth
  - Added MOBILE_AUTH.md documentation
- **Files touched:** `src/lib/mobile-auth.ts`, `src/app/api/auth/mobile/google/route.ts`, `src/app/api/analytics/route.ts`, `src/app/api/favorites/route.ts`, `src/app/api/visits/route.ts`
- **Risk/Notes:** New dependency: `jsonwebtoken`. Requires `JWT_SECRET` env var.
- **How to verify:** Test API with Bearer token header; verify web session auth still works

## Entry 9

- **Date:** 2026-01-17
- **Title:** feat(app): Add SWR client-side caching
- **Commits:** ec8cf04 (add cache)
- **What changed:**
  - Added SWR for client-side data fetching and caching
  - SWR provider, cache keys, and fetcher utility
- **Files touched:** `src/components/SWRProvider.tsx`, `src/lib/cache-keys.ts`, `src/lib/fetcher.ts`, `src/app/layout.tsx`, `src/app/(main)/page.tsx`, `src/app/analytics/page.tsx`
- **Risk/Notes:** New dependency: `swr`
- **How to verify:** Page loads should feel snappier; verify data refreshes on mutation

## Entry 8

- **Date:** 2026-01-14
- **Title:** feat(analytics): Analytics UX improvements
- **Commits:** a436eb2 (Update HCPCS breakdown to show total quantity count), 48aae4b (add slider), ae3ca46 (update breakdown group), 5d0425d (add copy function), a8b76e3 (update timestamp)
- **What changed:**
  - HCPCS breakdown shows total quantity count
  - Added date range slider for analytics
  - Updated breakdown grouping logic
  - Added copy-to-clipboard for visit data
- **Files touched:** `src/app/analytics/page.tsx`, `src/app/api/analytics/route.ts`, `src/app/(main)/page.tsx`, `src/components/EntryForm.tsx`
- **Risk/Notes:** None
- **How to verify:** Visit `/analytics`; check breakdown table, slider, and copy button

## Entry 7

- **Date:** 2026-01-14
- **Title:** fix(api): Order visits by creation date
- **Commits:** 2293e86 (Order visits by creation date instead of visit date)
- **What changed:**
  - Changed visit ordering from visit date to creation date (newest first)
- **Files touched:** `src/app/api/visits/route.ts`
- **Risk/Notes:** Visit display order will change for existing users
- **How to verify:** Create visits with different dates; confirm newest-created appears first

## Entry 6

- **Date:** 2026-01-12
- **Title:** fix(security): Patch React & Next.js CVEs
- **Commits:** cf22b1a (Fix React Server Components CVE vulnerabilities)
- **What changed:**
  - Updated React 19.2.0 to 19.2.1 (CVE-2025-55182)
  - Updated Next.js to patched version (CVE-2025-66478)
- **Files touched:** `package.json`, `package-lock.json`
- **Risk/Notes:** Security patches — should be deployed promptly
- **How to verify:** `npm run build && npm test`

## Entry 5

- **Date:** 2025-12-13
- **Title:** feat(visits): Add time tracking to visits
- **Commits:** 3218fab (add time in hours to card)
- **What changed:**
  - Added `time` column to visits table
  - Visit forms include optional time field (12-hour format)
  - Visit cards display formatted time
  - Edit modal supports time updates
- **Files touched:** `scripts/add-visit-time.sql`, `src/app/(main)/page.tsx`, `src/app/api/visits/route.ts`, `src/app/api/visits/[id]/route.ts`, `src/components/EditVisitModal.tsx`, `src/components/EntryForm.tsx`, `src/types/index.ts`
- **Risk/Notes:** Database migration required: `scripts/add-visit-time.sql`
- **How to verify:** Create a visit with time; verify time displays on card; edit time in modal

## Entry 4

- **Date:** 2025-12-12
- **Title:** feat(visits): Add no-show tracking
- **Commits:** b659246 (add no show), abc41fe (add no show analytics)
- **What changed:**
  - Added `is_no_show` column to visits
  - Quick-add no-show encounters (no procedures)
  - Orange-styled no-show visit cards
  - Analytics includes "Total No Shows" metric
- **Files touched:** `scripts/add-no-show-column.sql`, `src/app/(main)/page.tsx`, `src/app/api/visits/route.ts`, `src/app/analytics/page.tsx`, `src/app/api/analytics/route.ts`, `src/types/index.ts`
- **Risk/Notes:** Database migration required: `scripts/add-no-show-column.sql`
- **How to verify:** Add a no-show visit; verify orange styling; check analytics no-show count

## Entry 3

- **Date:** 2025-12-09
- **Title:** fix(analytics): Fix bar chart and encounter display
- **Commits:** 2597331 (fix bar chart), 0b5a462 (update encounter)
- **What changed:**
  - Fixed bar chart rendering issues
  - Updated encounter display logic
- **Files touched:** `src/app/analytics/page.tsx`
- **Risk/Notes:** None
- **How to verify:** Visit `/analytics`; verify charts render correctly

## Entry 2

- **Date:** 2025-12-02 – 2025-12-03
- **Title:** feat(core): Testing suite, date fixes, drag-and-drop favorites
- **Commits:** 60ce67c (add tests), a465f8e (fix analytics dates), af2e6b4 (update dates), 4bcea21 (update to local time), 4e668ca (update analytics dates), cae2653 (add drag and drop), aa6f2af (fix year period)
- **What changed:**
  - Comprehensive test suite (57 tests): date utilities, visits API, analytics API
  - Timezone-safe date utilities (`parseLocalDate`, `formatDate`, `getTodayString`)
  - Fixed analytics date grouping (removed DATE_TRUNC for daily)
  - Drag-and-drop favorites reordering with @dnd-kit
  - Fixed year period analytics
- **Files touched:** `src/lib/dateUtils.ts`, `src/lib/__tests__/dateUtils.test.ts`, `src/app/api/__tests__/visits.test.ts`, `src/app/api/__tests__/analytics.test.ts`, `src/components/FavoritesPicker.tsx`, `src/app/api/favorites/route.ts`, `scripts/migrate-favorites-sort.ts`, `jest.config.js`
- **Risk/Notes:** Database migration for favorites sort_order: `scripts/add-favorites-sort-order.sql`. New dev dependencies: jest, testing-library, @dnd-kit.
- **How to verify:** `npm test` — all 57 tests pass; drag favorites to reorder; verify dates display correctly

## Entry 1

- **Date:** 2025-11-24 – 2025-12-01
- **Title:** feat(core): Initial RVU Tracker application
- **Commits:** ae291e4 (Complete RVU Tracker with authentication, caching, and favorites), c147032 (Remove dongcschen_api_key.json), db5bb53 (analytics), 6510b8a (Fix TypeScript error), f6d36f3 (Remove Google Sheets API), 9009184 (Fix TypeScript build errors), 466e76b (Add environment configuration), 1f7930b (Update documentation), e3f035e (Fix OAuth authentication), e78001b (Update .gitignore), 8b1e1ce (update visit), b03955f (Fix visits ANY filter), 4d6d8c3 (Enhance multi-HCPCS support), 2747300 (Fix analytics bug and add visit editing), aa7ca98 (update buttons), 51a2b40 (add picker for mobile), 642f95b (remove fav confirmation page)
- **What changed:**
  - Full application scaffold: Next.js App Router, TypeScript, Tailwind CSS
  - Google OAuth authentication via Auth.js
  - Visit CRUD with multi-procedure support
  - HCPCS code autocomplete search (16,852 codes, in-memory cache)
  - Favorites management
  - Analytics dashboard with date ranges and period grouping
  - Database schema (visits, visit_procedures, favorites, rvu_codes)
  - RVU seed script and migration tooling
  - Environment configuration for dev/prod
  - Mobile picker support
  - Visit editing modal
- **Files touched:** `src/app/(main)/page.tsx`, `src/app/analytics/page.tsx`, `src/app/api/visits/route.ts`, `src/app/api/analytics/route.ts`, `src/app/api/favorites/route.ts`, `src/components/EntryForm.tsx`, `src/components/EditVisitModal.tsx`, `src/components/RVUPicker.tsx`, `src/components/ProcedureList.tsx`, `src/lib/db.ts`, `src/lib/rvu-cache.ts`, `scripts/init-db.sql`, `scripts/seed-rvu.ts`, `middleware.ts`
- **Risk/Notes:** Requires all env vars configured (see CLAUDE.md). Database must be initialized with `scripts/init-db.sql` and seeded.
- **How to verify:** `npm run dev`; sign in with Google; create a visit; check analytics at `/analytics`
