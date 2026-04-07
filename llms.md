# RVU Tracker (trackmyrvu.com)

> Full-stack Next.js 16 app for medical professionals to track procedure RVUs (Relative Value Units), manage HCPCS code favorites, log multi-procedure visits, and view analytics. Auth via Google/Apple OAuth, data in Neon Postgres, deployed on Vercel.

## Stack

- **Framework:** Next.js 16.0.7 (App Router) + React 19.2.1 + TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Auth:** Auth.js (next-auth v5 beta) — Google + Apple OAuth, mobile JWT
- **DB:** Neon Postgres via `@vercel/postgres`
- **Data fetching:** SWR
- **Drag & drop:** @dnd-kit
- **Testing:** Jest 30 + React Testing Library + Playwright (80 tests)
- **Dev server:** http://localhost:3001 (NOT 3000)

## Project Layout

```
src/
  app/
    (main)/page.tsx          # Authenticated home — visit cards
    analytics/page.tsx       # Analytics dashboard
    sign-in/page.tsx
    api/
      visits/                # Visit CRUD with procedures
      favorites/             # Drag-drop favorites
      rvu/search/            # HCPCS autocomplete
      analytics/             # Aggregations
      auth/[...nextauth]/    # Auth.js routes
      auth/mobile/{google,apple}/  # Mobile JWT exchange
      user/                  # Account deletion
  components/
    UserProfile.tsx
    RVUPicker.tsx            # HCPCS autocomplete
    FavoritesPicker.tsx      # Drag-drop favorites UI
    EntryForm.tsx            # Multi-procedure visit form
    EditVisitModal.tsx
    ProcedureList.tsx
    analytics/
      RVUChart.tsx
      SummaryStats.tsx
      BreakdownTable.tsx
      BonusProjection.tsx    # Bonus projection panel (current branch)
  lib/
    db.ts                    # Postgres client
    rvu-cache.ts             # In-memory cache of 16,852 RVU codes
    dateUtils.ts             # Timezone-safe date helpers
    fetcher.ts               # SWR fetcher
    cache-keys.ts            # SWR keys
    mobile-auth.ts           # Mobile JWT helpers
  types/index.ts
data/RVU.csv                 # 16,852 RVU codes
scripts/
  init-db.sql                # Schema
  seed-rvu.ts
  add-no-show-column.sql
  add-visit-time.sql
  migrate-favorites-sort.ts
docs/
  openapi.yaml               # OpenAPI 3.0 spec (also at /api-docs)
  FEATURE_LOG.md             # Append-only feature/PR ledger
__tests__/                   # Jest test files
```

## Database Schema

- **visits** (`id`, `user_id`, `date`, `time`, `notes`, `is_no_show`, `created_at`, `updated_at`)
- **visit_procedures** (`id`, `visit_id`, `hcpcs`, `description`, `status_code`, `work_rvu`, `quantity`)
- **favorites** (`id`, `user_id`, `hcpcs`, `sort_order`, `created_at`)
- **rvu_codes** (`id`, `hcpcs`, `description`, `status_code`, `work_rvu`)

## Commands

```bash
npm run dev          # Dev server on :3001
npm run build        # Type check + build
npm test             # Jest suite
npm run test:watch
npm run test:coverage

# DB
psql $POSTGRES_URL -f scripts/init-db.sql
npx tsx scripts/seed-rvu.ts
```

## Critical Conventions

- **Dates:** ALWAYS use `@/lib/dateUtils` (`parseLocalDate`, `formatDate`, `getTodayString`, `calculateTotalRVU`). NEVER `new Date(str)` — interprets as UTC and shifts timezones.
- **Analytics daily grouping** uses `v.date` directly — no `DATE_TRUNC` (timezone bugs).
- **State** is always local (`useState`). No global store, no Redux/Zustand/Context.
- **Components** are server by default; use `'use client'` only when needed.
- **Env files:** Use `.env.development` / `.env.production`. Do NOT use `.env.local` (precedence conflicts). Auth.js has `trustHost: true` for localhost.
- **No-show visits:** `is_no_show=true`, no procedures, can only be deleted (not edited).
- **Feature docs:** After implementing/modifying a feature, append to `docs/FEATURE_LOG.md` per `.claude/rules.md`.
- **Branches:** `feat/<name>`, `fix/<name>`, `chore/<name>`. Always PR — never merge to main directly.

## RVU Cache

`src/lib/rvu-cache.ts` loads all 16,852 RVU codes into memory at startup (~200-500ms), serves searches in ~5ms, refreshes every 24 hours.

```ts
await searchRVUCodes('99213', 100);
await getRVUCodeByHCPCS('99213');
await refreshCache();
getCacheStats();
```

## Authentication

- **Web:** Auth.js session cookies via Google OAuth (`/api/auth/[...nextauth]`)
- **Mobile:** JWT exchange via `/api/auth/mobile/google` and `/api/auth/mobile/apple`
- **Protected routes:** Check session in API handlers; redirect unauthenticated users to `/sign-in` on the client

## API

Full OpenAPI 3.0 spec at `docs/openapi.yaml`. Interactive Swagger UI:
- Production: https://trackmyrvu.com/api-docs
- Local: http://localhost:3001/api-docs

Endpoints: Visits, Favorites, RVU Search, Analytics, Auth, User.

## Deployment

- **Custom domain:** https://trackmyrvu.com
- **Platform:** Vercel
- **Env vars** (set in Vercel Dashboard): `NEXTAUTH_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `POSTGRES_URL`, plus other Neon vars.
- **OAuth redirect URIs** must include `https://trackmyrvu.com/api/auth/callback/google` and the localhost equivalent for dev.

## Key Docs

- `README.md` — public intro
- `CLAUDE.md` — full dev guide for Claude Code sessions
- `MEMORY.md` — short Claude memory pin
- `docs/FEATURE_LOG.md` — canonical append-only feature/PR log
- `docs/openapi.yaml` — API contract
- `.claude/rules.md` — feature summary template + git rules

## When Modifying This Codebase

1. Read the file before editing it.
2. Use date utilities — never `new Date(str)`.
3. Keep changes minimal and focused; don't refactor surrounding code.
4. Run `npm run build` and `npm test` before claiming done.
5. Append a new entry to `docs/FEATURE_LOG.md` when shipping a feature.
6. Open a PR — never merge to main.
