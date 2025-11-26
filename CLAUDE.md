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

**Development URL:** http://localhost:3001

### Environment Configuration

The project uses separate environment files for development and production:

- **`.env.development`** - Local development (automatically loaded by Next.js)
  - NEXTAUTH_URL: `http://localhost:3001`
  - Dev Google OAuth credentials from `configs/dev-oauth.json`
  - Client ID: `386826311054-0irihu7h7uc7ft0nfoh47l393dko7u6d`
  - Neon Postgres connection strings

- **`.env.production`** - Production template (for reference)
  - NEXTAUTH_URL: `https://hh-ncadsxhvs-projects.vercel.app`
  - Production OAuth credentials from `configs/prod-auth.json`
  - Client ID: `386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l`
  - Set actual values in Vercel Dashboard for deployment

- **`.env.example`** - Comprehensive documentation template

**OAuth Configuration Files:**
- `configs/dev-oauth.json` - Development OAuth credentials
- `configs/prod-auth.json` - Production OAuth credentials
- Both files are in `.gitignore` (protected)

**IMPORTANT:**
- Never commit `.env.development`, `.env.production`, or `configs/` files
- Do NOT use `.env.local` - it causes environment precedence conflicts
- Auth.js config includes `trustHost: true` for localhost development

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
- **Multi-Select Support:** Add multiple procedures to a single visit
- **Quantity Tracking:** Track procedure quantities with automatic RVU calculations
- **Favorites Management:** Save/toggle favorites from search results and procedure lists
- **Visit Management:** Create, read, update, delete visits with multiple procedures
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

## Development Workflow

**IMPORTANT: Always test build locally after implementation**

After completing any feature or making significant changes:

1. **Run local build test:**
   ```bash
   npm run build
   ```

2. **Verify build succeeds:**
   - Check for TypeScript errors
   - Check for build warnings
   - Ensure all routes compile successfully

3. **Test production build locally:**
   ```bash
   npm run start
   ```

4. **Only then proceed to:**
   - Update TASK.md with completion status
   - Update CLAUDE.md with new features
   - Commit changes

**Why this matters:**
- Catches TypeScript errors before deployment
- Identifies missing dependencies
- Prevents production build failures
- Ensures Next.js optimizations work correctly

---

## Current Status

**✅ PRODUCTION READY** - Full-stack RVU tracking application with authentication, database, caching, analytics, and multi-HCPCS visit support.

**Latest Updates (Phase 8):**
- Multi-procedure visits with quantity tracking
- Enhanced favorite management (save from search results)
- Improved RVU calculations (Quantity × Unit RVU)
- Junction table architecture (visits + visit_procedures)
- Real-time favorite toggling with star buttons

See TASK.md for detailed progress tracking.

---

## Deployment

### Vercel Deployment

**Production URL:** https://hh-ncadsxhvs-projects.vercel.app

**Environment Variables (Set in Vercel Dashboard):**
- `NEXTAUTH_URL` - Production URL
- `AUTH_SECRET` - Generated via `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - Production OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Production OAuth client secret
- `POSTGRES_URL` - Neon Postgres connection string
- All other database variables from `.env.production`

**Google OAuth Setup:**
1. ✅ Production OAuth app already created (client ID: `386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l`)
2. Add authorized redirect URI in Google Cloud Console:
   - `https://hh-ncadsxhvs-projects.vercel.app/api/auth/callback/google`
3. Update Vercel environment variables with values from `.env.production`

**Known Issues:**
- OAuth redirect_uri_mismatch errors occur when:
  - `.env.local` file exists (causes precedence conflicts - DO NOT USE)
  - Wrong OAuth client ID is configured
  - Redirect URI not set in Google Cloud Console
- **Solution:** Use only `.env.development` for local dev, ensure correct OAuth client IDs

---

**When working on this project:**
1. Keep it simple - avoid adding complexity
2. Use TypeScript strictly
3. Update environment variables carefully (separate for dev/prod)
4. Update TASK.md and CLAUDE.md after completing tasks
