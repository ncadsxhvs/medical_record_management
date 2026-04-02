# Task Plan: Recreate RVU Tracker Application

## Goal
Recreate the full-stack RVU Tracker (trackmyrvu.com) — a medical procedure RVU management app with Google OAuth, Postgres, analytics, and drag-and-drop favorites.

## Current Phase
Complete — documenting existing codebase for recreation

## Phases

### Phase 1: Project Setup & Configuration
- [ ] Initialize Next.js 16 project with TypeScript strict mode
- [ ] Install all dependencies (see findings.md § Dependencies)
- [ ] Configure Tailwind CSS v4 with `@tailwindcss/postcss`
- [ ] Configure TypeScript paths (`@/*` → `src/*`)
- [ ] Set up ESLint with `next/core-web-vitals`
- [ ] Create `.env.example` with all required variables
- [ ] Set up Jest + React Testing Library + Playwright
- **Status:** pending

### Phase 2: Database & Auth Foundation
- [ ] Set up Neon Postgres on Vercel
- [ ] Run `scripts/init-db.sql` — creates 6 tables (users, visits, visit_procedures, favorites, rvu_codes, entries)
- [ ] Seed RVU data from `data/RVU.csv` (16,852 codes) via `scripts/seed-rvu.ts`
- [ ] Configure Auth.js with Google OAuth provider (JWT strategy)
- [ ] Implement user upsert in JWT callback (`src/auth.ts`)
- [ ] Create `middleware.ts` for route protection
- [ ] Create sign-in page (`src/app/sign-in/page.tsx`)
- **Status:** pending

### Phase 3: Core Library & Utilities
- [ ] Create `src/lib/db.ts` — Postgres client + getUserId helper
- [ ] Create `src/lib/api-utils.ts` — withAuth middleware + apiError helper
- [ ] Create `src/lib/dateUtils.ts` — parseLocalDate, formatDate, getTodayString, calculateTotalRVU, formatTime
- [ ] Create `src/lib/rvu-cache.ts` — in-memory RVU cache (24h TTL, ~5ms search)
- [ ] Create `src/lib/mobile-auth.ts` — JWT verification for mobile clients
- [ ] Create `src/lib/auth-token.ts` — generateSessionToken with jose
- [ ] Create `src/lib/cache-keys.ts` — SWR cache key constants
- [ ] Create `src/lib/fetcher.ts` — SWR fetcher with error handling
- [ ] Create `src/lib/procedureUtils.ts` — rvuCodesToProcedures, fetchRvuCodeByHcpcs
- [ ] Create `src/types/index.ts` — all TypeScript interfaces
- [ ] Write dateUtils tests (23 tests)
- **Status:** pending

### Phase 4: API Routes
- [ ] `api/visits/route.ts` — GET all visits (with procedures), POST create visit
- [ ] `api/visits/[id]/route.ts` — PUT update visit, DELETE visit
- [ ] `api/favorites/route.ts` — GET, POST, PATCH (reorder)
- [ ] `api/favorites/[hcpcs]/route.ts` — DELETE
- [ ] `api/rvu/search/route.ts` — GET with query param
- [ ] `api/analytics/route.ts` — GET with period/start/end/groupBy params
- [ ] `api/user/route.ts` — DELETE account
- [ ] `api/auth/mobile/google/route.ts` — mobile OAuth
- [ ] `api/auth/mobile/apple/route.ts` — mobile Apple auth
- [ ] Write API tests (visits: 20, analytics: 14, favorites, rvu-search, user)
- **Status:** pending

### Phase 5: UI Components
- [ ] Root layout with SessionProvider, SWRProvider, CacheWarmer
- [ ] `RVUPicker.tsx` — HCPCS autocomplete search with debounce
- [ ] `FavoritesPicker.tsx` — drag-and-drop with @dnd-kit
- [ ] `EntryForm.tsx` — multi-procedure visit form (date, time, notes, procedures)
- [ ] `ProcedureList.tsx` — procedure display with quantity controls
- [ ] `EditVisitModal.tsx` — edit existing visits
- [ ] `VisitCard.tsx` — visit display with no-show badge, RVU totals
- [ ] `UserProfile.tsx` — profile dropdown with sign-out
- [ ] `CacheWarmer.tsx` — server component to preload RVU cache
- [ ] `SWRProvider.tsx` — SWR config wrapper
- [ ] `useFavorites.ts` hook — favorites state management
- **Status:** pending

### Phase 6: Pages & Features
- [ ] Main page `(main)/page.tsx` — visit cards, form, delete/edit/copy handlers
- [ ] Analytics page — date range, period grouping, RVU chart, breakdown table, summary stats
- [ ] Analytics components: `RVUChart.tsx`, `SummaryStats.tsx`, `BreakdownTable.tsx`
- [ ] Privacy policy page
- [ ] API docs page (Swagger UI viewer)
- **Status:** pending

### Phase 7: Deployment & Polish
- [ ] Configure Vercel deployment
- [ ] Set production env vars in Vercel Dashboard
- [ ] Configure Google OAuth for production domain
- [ ] Set up custom domain (trackmyrvu.com)
- [ ] Verify all 57+ tests pass
- [ ] Run production build
- **Status:** pending

## Key Questions
1. Same Neon Postgres instance or new database? → TBD
2. Reuse existing Google OAuth app or create new? → TBD
3. Same Vercel project or new? → TBD
4. Keep legacy `entries` table? → Deprecated, skip unless needed for migration

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Next.js 16 App Router | Server components by default, API routes, middleware |
| Auth.js (NextAuth v5 beta) | Google OAuth with JWT strategy, middleware integration |
| Neon Postgres via @vercel/postgres | Serverless-friendly, Vercel integration |
| In-memory RVU cache | 16,852 codes, ~5ms search vs database queries |
| @dnd-kit for drag-and-drop | Favorites reordering, lightweight, accessible |
| SWR for client data fetching | Automatic revalidation, deduping, caching |
| Tailwind CSS v4 | Utility-first, no separate config file needed |
| Timezone-independent dates | parseLocalDate() prevents UTC shift bugs |
| No global state management | useState only — keeps it simple |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Notes
- All dates MUST use `parseLocalDate()` — never `new Date(str)` directly
- Status codes in visit_procedures are max 2 chars
- HCPCS codes match pattern `/^[A-Za-z0-9]{4,5}$/`
- Dev server runs on port 3001
- No `.env.local` — causes precedence conflicts with Auth.js
