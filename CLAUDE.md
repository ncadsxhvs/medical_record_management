# Claude Development Guide
## RVU Tracker - Medical Procedure RVU Management

This document guides Claude through working on this Next.js project.

---

## Project Overview

A full-stack application for tracking medical procedure RVUs (Relative Value Units) with Google OAuth authentication, Postgres database, analytics dashboard, and comprehensive testing.

## Tech Stack

- **Framework:** Next.js 16.0.7 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Authentication:** Auth.js (NextAuth) with Google OAuth
- **Database:** Neon Postgres (Vercel)
- **API:** Next.js API Routes
- **Testing:** Jest, React Testing Library, Playwright
- **Drag-and-Drop:** @dnd-kit (favorites reordering)

## Project Structure

```
src/
├── app/
│   ├── (main)/
│   │   └── page.tsx            # Main authenticated page (visit cards)
│   ├── analytics/
│   │   └── page.tsx            # Analytics dashboard
│   ├── api/
│   │   ├── entries/            # Legacy entry CRUD (deprecated)
│   │   ├── favorites/          # Favorites management with drag-drop
│   │   ├── rvu/                # RVU search & cache
│   │   ├── analytics/          # Analytics data endpoints
│   │   └── visits/             # Visit CRUD with procedures
│   ├── sign-in/
│   │   └── page.tsx            # Google sign-in page
│   ├── globals.css
│   └── layout.tsx              # Root layout
├── components/
│   ├── UserProfile.tsx         # User profile dropdown
│   ├── RVUPicker.tsx           # HCPCS autocomplete search
│   ├── FavoritesPicker.tsx     # Drag-and-drop favorites
│   ├── EntryForm.tsx           # Multi-procedure visit form
│   ├── EditVisitModal.tsx      # Edit existing visits
│   └── ProcedureList.tsx       # Procedure display with quantities
├── lib/
│   ├── db.ts                   # Postgres client
│   ├── rvu-cache.ts            # In-memory RVU cache
│   └── dateUtils.ts            # Date utilities (timezone-safe)
└── types/
    └── index.ts                # TypeScript types

data/
  RVU.csv                       # 16,852 RVU codes

scripts/
  init-db.sql                   # Database schema
  seed-rvu.ts                   # Seed RVU data
  migrate-favorites-sort.ts     # Favorites sort_order migration

__tests__/                      # Test files
  src/lib/__tests__/
    dateUtils.test.ts           # Date utility tests (23 tests)
  src/app/api/__tests__/
    visits.test.ts              # Visits API tests (20 tests)
    analytics.test.ts           # Analytics API tests (14 tests)
```

## Development

### Quick Start

```bash
npm run dev                 # Development server (port 3001)
npm run build              # Production build
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

**Development URL:** http://localhost:3001

### Environment Configuration

The project uses separate environment files:

- **`.env.development`** - Local development
  - NEXTAUTH_URL: `http://localhost:3001`
  - Dev Google OAuth credentials
  - Neon Postgres connection strings

- **`.env.production`** - Production template
  - NEXTAUTH_URL: `https://trackmyrvu.com`
  - Production OAuth credentials
  - Set actual values in Vercel Dashboard

**IMPORTANT:**
- Never commit `.env.development` or `.env.production`
- Do NOT use `.env.local` - causes environment precedence conflicts
- Auth.js config includes `trustHost: true` for localhost

### Database Setup

```bash
# Run migrations
psql $POSTGRES_URL -f scripts/init-db.sql

# Seed RVU data
npx tsx scripts/seed-rvu.ts

# Run favorites migration
npx tsx scripts/migrate-favorites-sort.ts
```

## Core Features

### Authentication
- Google OAuth sign-in via Auth.js
- User-specific data isolation
- Session management

### Visit Management
- Create visits with multiple procedures
- Each procedure has HCPCS code, quantity, RVU value
- Edit existing visits (add/remove procedures, change quantities)
- Delete visits
- Ordered by date DESC

### HCPCS Code Picker
- Autocomplete search across 16,852+ RVU codes
- In-memory cache for instant search (~5ms queries)
- Multi-select support for adding multiple procedures

### Favorites
- Save frequently used HCPCS codes
- **Drag-and-drop reordering** using @dnd-kit
- Persistent sort order in database
- Quick-add to visit form
- Delete from favorites

### Analytics Dashboard
- Date range filtering
- Period grouping: Daily, Weekly, Monthly, Yearly
- Summary view: RVU chart over time
- HCPCS breakdown: Detailed procedure statistics
- Metrics: Total RVUs, Total Entries, Avg RVU per Entry

### Testing
- **57 passing tests** covering date handling, RVU calculations, API logic
- Jest + React Testing Library
- Timezone-independent date tests
- See TESTING.md for details

## RVU Cache System

In-memory cache for optimal search performance:

- **Location:** `src/lib/rvu-cache.ts`
- **Capacity:** 16,852 RVU codes
- **Load Time:** ~200-500ms initial load
- **Search Time:** ~5ms average per query
- **Cache Duration:** 24 hours
- **Auto-reload:** On app startup

### Cache API

```typescript
await searchRVUCodes('99213', 100);
await getRVUCodeByHCPCS('99213');
await refreshCache();
getCacheStats();
```

## Date Handling (CRITICAL)

All dates use **timezone-independent** handling:

### Date Utilities (`src/lib/dateUtils.ts`)

```typescript
import { parseLocalDate, formatDate, getTodayString, calculateTotalRVU } from '@/lib/dateUtils';

// Parse date string without timezone shifts
const date = parseLocalDate('2025-12-02');

// Format for display
const formatted = formatDate('2025-12-02');

// Get today as YYYY-MM-DD
const today = getTodayString();

// Calculate total RVU with quantities
const total = calculateTotalRVU(procedures);
```

### Key Principles

1. **Storage:** Dates stored as DATE type (YYYY-MM-DD) in database
2. **Parsing:** Always use `parseLocalDate()` - never `new Date(str)`
3. **Display:** Use `formatDate()` for consistent formatting
4. **Analytics:** Daily grouping uses `v.date` directly (no DATE_TRUNC)

### Common Date Issues

**❌ WRONG:**
```typescript
const date = new Date('2025-12-02');  // Interprets as UTC, shifts timezone
```

**✅ CORRECT:**
```typescript
const date = parseLocalDate('2025-12-02');  // Local date, no shift
```

## Database Schema

### Tables

- **visits** - Parent record for each visit
  - `id`, `user_id`, `date`, `notes`, `created_at`, `updated_at`

- **visit_procedures** - Procedures for each visit
  - `id`, `visit_id`, `hcpcs`, `description`, `status_code`, `work_rvu`, `quantity`

- **favorites** - User's favorite HCPCS codes
  - `id`, `user_id`, `hcpcs`, `sort_order`, `created_at`

- **rvu_codes** - Master RVU code list
  - `id`, `hcpcs`, `description`, `status_code`, `work_rvu`

## Dependencies

### Core
- **next**: 16.0.7 (patched CVE-2025-66478)
- **react**: 19.2.1 (patched CVE-2025-55182)
- **next-auth**: 5.0.0-beta.30
- **@vercel/postgres**: 0.10.0

### Drag-and-Drop
- **@dnd-kit/core**: 6.3.1
- **@dnd-kit/sortable**: 10.0.0
- **@dnd-kit/utilities**: 3.2.2

### Testing (DevDependencies)
- **jest**: 30.2.0
- **@testing-library/react**: 16.3.0
- **@testing-library/jest-dom**: 6.9.1
- **@playwright/test**: 1.57.0

## Conventions

- **Components:** Server components by default, use `'use client'` when needed
- **State:** All state is local (useState) - no global state management
- **Styling:** Tailwind CSS for all styling
- **TypeScript:** Strict mode enabled
- **Dates:** ALWAYS use date utilities from `@/lib/dateUtils`
- **Testing:** Write tests for date handling, RVU calculations, critical flows
- **Documentation:** CRITICAL - Always update CLAUDE.md and TASK.md after changes

## Deployment

### Production URL
**Custom Domain:** https://trackmyrvu.com
**Vercel URL:** https://hh-ncadsxhvs-projects.vercel.app

### Environment Variables (Vercel Dashboard)

Required production environment variables:
- `NEXTAUTH_URL` - https://trackmyrvu.com
- `AUTH_SECRET` - Generated via `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - Production OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Production OAuth client secret
- `POSTGRES_URL` - Neon Postgres connection string
- All other database variables from `.env.production`

### Google OAuth Setup

**Production OAuth App:**
- Client ID: `386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l`
- Authorized redirect URIs:
  - `https://trackmyrvu.com/api/auth/callback/google`
  - `https://www.trackmyrvu.com/api/auth/callback/google`
  - `https://hh-ncadsxhvs-projects.vercel.app/api/auth/callback/google` (backup)

**Development OAuth App:**
- Client ID: `386826311054-0irihu7h7uc7ft0nfoh47l393dko7u6d`
- Authorized redirect URI:
  - `http://localhost:3001/api/auth/callback/google`

## Recent Updates

### Security Patches (2025-01-XX)
- Updated React 19.2.0 → 19.2.1 (CVE-2025-55182)
- Updated Next.js 16.0.3 → 16.0.7 (CVE-2025-66478)
- Fixed remote code execution vulnerability in React Server Components

### Testing Implementation
- Added comprehensive test suite (57 tests)
- Created date utility functions for timezone-safe operations
- Tests cover: date parsing, RVU calculations, analytics, visits API
- See TESTING.md for full documentation

### Date Fixes
- Fixed timezone issues in main page visit cards
- Fixed analytics date grouping (removed DATE_TRUNC for daily)
- All dates now parse and display correctly across timezones

### Custom Domain
- Configured trackmyrvu.com as primary domain
- Updated all documentation and environment templates

---

## Current Status

**✅ PRODUCTION READY**

Full-stack RVU tracking application with:
- Authentication ✅
- Multi-procedure visits ✅
- Drag-and-drop favorites ✅
- Analytics dashboard ✅
- Comprehensive testing ✅
- Security patches applied ✅
- Custom domain configured ✅

See TASK.md for detailed progress tracking.

---

## When Working on This Project

1. **Keep it simple** - Avoid adding complexity
2. **Use TypeScript strictly** - Enable all type checking
3. **Use date utilities** - NEVER use `new Date(str)` directly
4. **Write tests** - Especially for date handling and calculations
5. **Update documentation** - CRITICAL: Always update CLAUDE.md and TASK.md
6. **Test timezone behavior** - Verify dates work on both localhost and production
