# Development Tasks
## RVU Tracker - Medical Procedure RVU Management

Progress tracker for RVU Tracker application with Postgres backend, authentication, and analytics.

---

## Architecture

Full-stack application for tracking medical procedure RVUs (Relative Value Units):
- **Authentication:** Auth.js with Google OAuth
- **Database:** Neon Postgres (Vercel)
- **Backend:** Next.js 16 API Routes
- **Frontend:** React 19 with Tailwind CSS

**Core Features:**
- Google sign-in authentication
- HCPCS code picker with 19K+ codes from RVU.csv
- Favorites management (per-user)
- Entry CRUD operations (date, HCPCS, patient, notes)
- Analytics dashboard (daily/weekly/monthly/yearly RVU summations)
- Responsive, minimalist UI

---

## Phase 0: Project Setup ✅ COMPLETED

- [x] Initialize Next.js 16 project with App Router
- [x] Configure TypeScript strict mode
- [x] Set up Tailwind CSS
- [x] Install dependencies (`googleapis`)
- [x] Create project folder structure
- [x] Set up `.gitignore`
- [x] Create `.env.example`

---

## Phase 1: Authentication Setup ✅ COMPLETED

- [x] Install Auth.js (`next-auth@beta`)
- [x] Create Auth.js configuration (`src/auth.ts`)
- [x] Set up Google OAuth provider
- [x] Create API route (`/api/auth/[...nextauth]/route.ts`)
- [x] Update layout with SessionProvider
- [x] Create sign-in page with Google button
- [x] Update UserProfile component
- [x] Configure Google OAuth credentials
- [x] Generate AUTH_SECRET
- [x] Test authentication flow

**Google OAuth Client ID:** `386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l.apps.googleusercontent.com`

---

## Phase 2: Database Setup ✅ COMPLETED

- [x] Install `@vercel/postgres`
- [x] Create database schema (`scripts/init-db.sql`)
  - [x] `rvu_codes` table with indexes
  - [x] `entries` table with user_id, date indexes
  - [x] `favorites` table with unique constraint
  - [x] Auto-update trigger for `updated_at`
- [x] Create seed script (`scripts/seed-rvu.ts`)
  - [x] Batch insert (100 rows/batch)
  - [x] Parse RVU.csv (19,090 codes)
  - [x] Upsert on conflict
- [x] Create database client (`src/lib/db.ts`)
- [x] Update TypeScript types (`src/types/index.ts`)
  - [x] RVUCode, Entry, Favorite interfaces
  - [x] Analytics types

**Database:** Neon Postgres on Vercel

---

## Phase 3: API Routes 🔄 IN PROGRESS

- [ ] Create entries API
  - [ ] `POST /api/entries` - Create entry
  - [ ] `GET /api/entries` - List user's entries
  - [ ] `PUT /api/entries/[id]` - Update entry
  - [ ] `DELETE /api/entries/[id]` - Delete entry
- [ ] Create RVU search API
  - [ ] `GET /api/rvu/search?q=<query>` - Search HCPCS codes
- [ ] Create favorites API
  - [ ] `GET /api/favorites` - Get user's favorites
  - [ ] `POST /api/favorites` - Add favorite
  - [ ] `DELETE /api/favorites/[hcpcs]` - Remove favorite
- [ ] Create analytics API
  - [ ] `GET /api/analytics?period=...&start=...&end=...`

---

## Phase 4: UI Components 📋 PENDING

- [ ] Create RVUPicker component
  - [ ] Autocomplete search with debounce
  - [ ] Dropdown with favorites + results
  - [ ] Star icon to toggle favorites
- [ ] Create FavoritesPicker component
  - [ ] Quick-access grid
  - [ ] Click to select
- [ ] Create EntryForm component
  - [ ] RVUPicker integration
  - [ ] Date, patient_name, notes fields
  - [ ] Auto-fill from RVU selection

---

## Phase 5: Main Application 📋 PENDING

- [ ] Update main page (`/app/(main)/page.tsx`)
  - [ ] Replace Google Sheets logic with Postgres
  - [ ] Integrate EntryForm
  - [ ] Add FavoritesPicker
  - [ ] Add date range filter
  - [ ] Add pagination
- [ ] Create analytics dashboard (`/app/analytics/page.tsx`)
  - [ ] Period selector (daily/weekly/monthly/yearly)
  - [ ] Date range picker
  - [ ] RVU summation display
  - [ ] Top HCPCS codes breakdown
  - [ ] Simple bar chart (Tailwind)

---

## Phase 6: Cleanup 📋 PENDING

- [ ] Delete Google Sheets files
  - [ ] `src/lib/google-sheets.ts`
  - [ ] `src/app/api/sheets/*`
  - [ ] `config/dongcschen_api_key.json`
  - [ ] `src/config/defaults.ts`
- [ ] Uninstall `googleapis`
- [ ] Update documentation

---

## Current File Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── page.tsx                    # Main authenticated page
│   │   └── loading.tsx                 # Loading component
│   ├── analytics/
│   │   └── page.tsx                    # Analytics dashboard (PENDING)
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts                # Auth.js handler
│   │   ├── entries/                    # Entry CRUD (PENDING)
│   │   ├── rvu/search/                 # RVU search (PENDING)
│   │   ├── favorites/                  # Favorites CRUD (PENDING)
│   │   ├── analytics/                  # Analytics (PENDING)
│   │   └── sheets/                     # Google Sheets (TO BE REMOVED)
│   ├── sign-in/
│   │   └── page.tsx                    # Google sign-in page
│   ├── globals.css
│   └── layout.tsx                      # Root layout with SessionProvider
├── components/
│   ├── UserProfile.tsx                 # User profile with sign-out
│   ├── RVUPicker.tsx                   # HCPCS picker (PENDING)
│   ├── FavoritesPicker.tsx             # Favorites grid (PENDING)
│   └── EntryForm.tsx                   # Entry form (PENDING)
├── lib/
│   ├── db.ts                           # Postgres client
│   ├── google-sheets.ts                # Google Sheets (TO BE REMOVED)
│   └── auth.ts                         # Auth.js config
└── types/
    └── index.ts                        # TypeScript interfaces

data/
  RVU.csv                               # RVU codes (19,090 rows)

scripts/
  init-db.sql                           # Database schema
  seed-rvu.ts                           # RVU data seeder

keys/
  client_secret_*.json                  # Google OAuth credentials
```

---

## Next Steps

### Immediate (Phase 3):
1. Run database migrations: `psql $POSTGRES_URL -f scripts/init-db.sql`
2. Seed RVU data: `npx tsx scripts/seed-rvu.ts`
3. Create API routes (entries, RVU search, favorites, analytics)

### After API Routes (Phase 4-5):
4. Build UI components (RVUPicker, FavoritesPicker, EntryForm)
5. Update main page with new components
6. Create analytics dashboard

### Cleanup (Phase 6):
7. Remove Google Sheets code and dependencies
8. Final testing

---

## Quick Start

```bash
npm run dev          # Start development server (http://localhost:3001)
```

**Usage:**
1. Visit http://localhost:3001
2. Click "Sign in with Google"
3. Add medical procedure entries with HCPCS codes
4. Track RVUs over time
5. View analytics dashboard

---

## Current Status

**✅ Completed:**
- Authentication (Google OAuth via Auth.js)
- Database schema and migration scripts
- TypeScript types
- Basic project structure

**🔄 In Progress:**
- API routes implementation

**📋 Pending:**
- UI components (RVU picker, favorites, forms)
- Main application integration
- Analytics dashboard
- Google Sheets code removal
