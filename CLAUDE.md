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
│   ├── api/
│   │   └── sheets/
│   │       └── read/
│   │           └── route.ts    # POST: load sheet, GET: service account email
│   ├── globals.css
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Single-page app (form + cards)
└── types/
    └── index.ts                # TypeScript types

config/
  dongcschen_api_key.json       # Google service account credentials (gitignored)

scripts/
  test-sheets.ts                # Test script for Sheets API
```

## Key Files

### src/app/page.tsx
Single-page application with:
- URL input form (initial state)
- Cards display (after loading sheet)
- Each card shows all columns from the row

### src/app/api/sheets/read/route.ts
- **POST:** Accepts `{ url: string }`, returns `{ success, data: { headers, rows, metadata } }`
- **GET:** Returns service account email for sharing instructions

**Key file locations checked (in order):**
1. `config/dongcschen_api_key.json`
2. `dongcschen_api_key.json`
3. `config/service-account.json`


## Development

### Quick Start

```bash
./start.sh           # Start development server
# or
npm run dev
```

### Test Sheets Integration

```bash
SHEET_URL="https://docs.google.com/spreadsheets/d/..." npx tsx scripts/test-sheets.ts
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
386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l.apps.googleusercontent.com
Response includes cache statistics and load time.

## Conventions

- Server components by default, mark `'use client'` when needed
- All state is local (useState) - no global state management
- Tailwind CSS for all styling
- No external UI libraries


---

## Current Status

See TASK.md for detailed progress tracking.

---

**When working on this project:**
1. Keep it simple - avoid adding complexity
2. Use TypeScript strictly
3. Update TASK.md after completing tasks
