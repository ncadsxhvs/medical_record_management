# Claude Development Guide
## RVU Tracker - Medical Procedure RVU Management

This document guides Claude through working on this Next.js project.

---

## Project Overview

A full-stack application for tracking medical procedure RVUs (Relative Value Units) with Google OAuth authentication, Postgres database, and analytics dashboard.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Authentication:** Auth.js with Google OAuth
- **Database:** Neon Postgres (Vercel)
- **API:** Next.js API Routes

## Project Structure

```
src/
├── app/
│   ├── (main)/
│   │   └── page.tsx            # Main authenticated page
│   ├── analytics/
│   │   └── page.tsx            # Analytics dashboard
│   ├── api/
│   │   ├── entries/            # Entry CRUD operations
│   │   ├── favorites/          # Favorites management
│   │   ├── rvu/                # RVU search & cache
│   │   └── analytics/          # Analytics data
│   ├── sign-in/
│   │   └── page.tsx            # Google sign-in page
│   ├── globals.css
│   └── layout.tsx              # Root layout
├── components/
│   ├── UserProfile.tsx         # User profile dropdown
│   ├── RVUPicker.tsx           # HCPCS autocomplete
│   ├── FavoritesPicker.tsx     # Saved favorites
│   └── EntryForm.tsx           # Entry creation form
├── lib/
│   ├── db.ts                   # Postgres client
│   └── rvu-cache.ts            # In-memory RVU cache
└── types/
    └── index.ts                # TypeScript types

data/
  RVU.csv                       # 16,852 RVU codes

scripts/
  init-db.sql                   # Database schema
  seed-rvu.ts                   # Seed RVU data
```

## Development

### Quick Start

```bash
./start.sh           # Start development server (port 3001)
# or
npm run dev
```

### Database Setup

```bash
# Run migrations
psql $POSTGRES_URL -f scripts/init-db.sql

# Seed RVU data
npx tsx scripts/seed-rvu.ts
```

### Build

```bash
npm run build
npm run start
```

## Core Features

- **Authentication:** Google OAuth sign-in
- **HCPCS Code Picker:** Autocomplete search across 16,852+ RVU codes
- **Favorites Management:** Save frequently used HCPCS codes
- **Entry CRUD:** Create, read, update, delete procedure entries
- **Analytics Dashboard:** Daily/weekly/monthly/yearly RVU summations
- **Performance:** In-memory cache for instant search (~5ms queries)

## RVU Cache System

The application uses an in-memory cache for optimal search performance:

- **Location:** `src/lib/rvu-cache.ts`
- **Capacity:** 16,852 RVU codes
- **Load Time:** ~200-500ms initial load
- **Search Time:** ~5ms average per query
- **Cache Duration:** 24 hours
- **Auto-reload:** On app startup via `CacheWarmer` component

### Cache API

```typescript
// Search RVU codes
await searchRVUCodes('99213', 100);

// Get specific code
await getRVUCodeByHCPCS('99213');

// Refresh cache manually
await refreshCache();

// Get cache statistics
getCacheStats();
```

### Warmup Endpoint

```bash
curl http://localhost:3001/api/rvu/warmup
```

Response includes cache statistics and load time.

## Conventions

- Server components by default, mark `'use client'` when needed
- All state is local (useState) - no global state management
- Tailwind CSS for all styling
- No external UI libraries
- TypeScript strict mode enabled

---

## Current Status

**✅ PRODUCTION READY** - Full-stack RVU tracking application with authentication, database, caching, and analytics.

See TASK.md for detailed progress tracking.

---

**When working on this project:**
1. Keep it simple - avoid adding complexity
2. Use TypeScript strictly
3. Test with actual Google Sheets (share with service account first)
4. Update TASK.md after completing tasks
