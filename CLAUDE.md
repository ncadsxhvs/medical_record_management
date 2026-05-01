# Claude Development Guide
## RVU Tracker - Medical Procedure RVU Management

---

## Project Overview

Full-stack app for tracking medical procedure RVUs (Relative Value Units). Google OAuth, Postgres, analytics dashboard, 80+ tests.

**Production:** https://trackmyrvu.com
**Dev server:** http://localhost:3001

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Authentication:** Auth.js (NextAuth) with Google OAuth
- **Database:** Neon Postgres (Vercel)
- **Testing:** Jest, React Testing Library, Playwright
- **Drag-and-Drop:** @dnd-kit (favorites reordering)

## Quick Start

```bash
npm run dev                 # Dev server (port 3001)
npm run build              # Production build
npm test                   # Run all tests
```

## Project Structure

```
src/
├── app/
│   ├── (main)/page.tsx         # Main page (visit cards)
│   ├── analytics/page.tsx      # Analytics dashboard
│   ├── productivity/page.tsx   # Productivity view
│   ├── api/                    # API routes (visits, favorites, rvu, analytics)
│   ├── sign-in/page.tsx        # Google sign-in
│   └── layout.tsx              # Root layout
├── components/                 # UI components
├── lib/
│   ├── db.ts                   # Postgres client
│   ├── rvu-cache.ts            # In-memory RVU cache (16,852 codes, ~5ms search)
│   └── dateUtils.ts            # Date utilities (timezone-safe)
└── types/index.ts

scripts/                        # DB migrations and seed scripts
docs/features/                  # Platform-agnostic feature specs
```

## Date Handling (CRITICAL)

All dates use **timezone-independent** handling via `src/lib/dateUtils.ts`.

**❌ WRONG:** `new Date('2025-12-02')` — interprets as UTC, shifts timezone
**✅ CORRECT:** `parseLocalDate('2025-12-02')` — local date, no shift

- **Storage:** DATE type (YYYY-MM-DD) in database
- **Parsing:** Always use `parseLocalDate()` — never `new Date(str)`
- **Display:** Use `formatDate()` for consistent formatting
- **Analytics:** Daily grouping uses `v.date` directly (no DATE_TRUNC)

## Database Schema

- **visits** — `id, user_id, date, time, notes, is_no_show, created_at, updated_at`
- **visit_procedures** — `id, visit_id, hcpcs, description, status_code, work_rvu, quantity`
- **favorites** — `id, user_id, hcpcs, sort_order, created_at`
- **rvu_codes** — `id, hcpcs, description, status_code, work_rvu`

## Conventions

- **Components:** Server components by default, `'use client'` when needed
- **State:** All local (useState) — no global state management
- **Styling:** Tailwind CSS for all styling
- **TypeScript:** Strict mode enabled
- **Dates:** ALWAYS use date utilities from `@/lib/dateUtils`
- **Env files:** Use `.env.development` / `.env.production`. Do NOT use `.env.local` (precedence conflicts)
- **Documentation:** ENFORCED — see `.claude/rules.md` for requirements

## Development Workflow

Follow this workflow for every development task:

1. **Explore** — Read relevant files to understand current code and patterns
2. **Plan** — Design the approach (plan mode if complex, inline if simple)
   - If the task involves UI/UX changes, invoke **`/ui-ux-pro-max:ui-ux-pro-max`** skill during planning for design recommendations
3. **Harness design** — Invoke the **harness-design skill** right after planning to set up browser-based development and verification
4. **Implement** — Edit files following the plan
5. **Build** — Run `npm run build` to verify no errors
6. **Browser verify** (required for ANY UI change under `src/components/` or `src/app/`):
   - a. Check the **browser console** for errors/warnings (use Playwright `page.on('console')` or `browser_console_messages` MCP tool)
   - b. Run the **UI review checklist**:
     - Data display correctness (no "NaN", "undefined", bad dates)
     - Mobile layout at 375px actually works
     - KPI/summary values match visible data
     - State synchronization produces visible UI
     - Touch targets don't break layout on small screens
   - c. Screenshot desktop + mobile and visually verify before reporting done
7. **Update docs** — Append `docs/FEATURE_LOG.md` entry + create/update `docs/features/<name>.md` (use `git add -f docs/` since docs/ is gitignored). Do this BEFORE pushing, not after CI fails.
8. **Commit & push** — Stage specific files, commit, push to branch
9. **Create PR** — Use `gh pr create` with summary and test plan

**Never skip step 6 for UI changes.** Code correctness != feature correctness.

## Skill Routing

| When | Skill/Plugin |
|------|-------------|
| UI/UX planning & design | `/ui-ux-pro-max:ui-ux-pro-max` during step 2 |
| Any feature build | `harness-design` skill at step 3 |
| UI polish & component architecture | `taste-skill` for bias corrections and creative patterns |

## Feature Specs

Platform-agnostic per-feature specs live in `docs/features/`. Format defined in `.claude/rules.md`.

Each spec must allow a Claude Code agent on an iOS / SwiftUI project to recreate the feature without reading web source code.
