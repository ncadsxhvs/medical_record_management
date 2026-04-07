# Project Memory: hh (RVU Tracker / trackmyrvu.com)

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind CSS 4
- Auth.js (next-auth v5 beta) — Google OAuth
- Neon Postgres via @vercel/postgres
- SWR for client data fetching
- @dnd-kit for drag-and-drop
- Jest + RTL + Playwright (80 tests currently)
- Deployed on Vercel

## Dev Commands
- `npm run dev` — port **3001** (not 3000)
- `npm run build` — type check + build
- `npm test` — Jest suite

## Critical Conventions
- **Dates:** ALWAYS use `@/lib/dateUtils` (`parseLocalDate`, `formatDate`, `getTodayString`). NEVER `new Date(str)` — causes timezone shifts.
- **Env files:** Use `.env.development` / `.env.production`. Do NOT use `.env.local` (precedence conflicts).
- **State:** All local `useState`. No global store.
- **Components:** Server by default, `'use client'` when needed.
- **Feature docs (ENFORCED by CI):** Every PR touching `src/`/`scripts/`/`data/` must update both `docs/FEATURE_LOG.md` (new entry) and `docs/features/<name>.md` (rich, platform-agnostic spec — must be reproducible on iOS without web source). Template in `.claude/rules.md`. Workflow: `.github/workflows/docs-check.yml`.

## Key Paths
- Analytics page: `src/app/analytics/page.tsx`
- Analytics components: `src/components/analytics/` (RVUChart, SummaryStats, BreakdownTable, BonusProjection)
- Date utils: `src/lib/dateUtils.ts`
- RVU cache: `src/lib/rvu-cache.ts` (16,852 codes, in-memory, ~5ms search)
- DB schema: `scripts/init-db.sql`
- API: `src/app/api/{visits,favorites,rvu,analytics}/`
- Tracker: `TASK.md` (append new features at the end with date + branch)

## DB Tables
- `visits` (id, user_id, date, time, notes, is_no_show, ...)
- `visit_procedures` (visit_id, hcpcs, description, status_code, work_rvu, quantity)
- `favorites` (user_id, hcpcs, sort_order)
- `rvu_codes` (hcpcs, description, status_code, work_rvu)

## Gotchas
- Analytics daily grouping uses `v.date` directly — no `DATE_TRUNC` (timezone bugs).
- Auth.js config uses `trustHost: true` for localhost.
- Production domain is `trackmyrvu.com`; OAuth has separate dev/prod client IDs.
- No-show visits have `is_no_show=true`, no procedures, can only be deleted (not edited).

## Current Branch Context
- `feat/rvu-target` — Bonus Projection panel on analytics page (custom date target period, prorated annual bonus). Component: `src/components/analytics/BonusProjection.tsx`.
