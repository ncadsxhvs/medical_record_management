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

## Phase 3: API Routes ✅ COMPLETED

- [x] Create entries API
  - [x] `POST /api/entries` - Create entry
  - [x] `GET /api/entries` - List user's entries
  - [x] `PUT /api/entries/[id]` - Update entry
  - [x] `DELETE /api/entries/[id]` - Delete entry
- [x] Create RVU search API
  - [x] `GET /api/rvu/search?q=<query>` - Search HCPCS codes
- [x] Create favorites API
  - [x] `GET /api/favorites` - Get user's favorites
  - [x] `POST /api/favorites` - Add favorite
  - [x] `DELETE /api/favorites/[hcpcs]` - Remove favorite
- [x] Create analytics API
  - [x] `GET /api/analytics?period=...&start=...&end=...`

---

## Phase 4: UI Components ✅ COMPLETED

- [x] Create RVUPicker component
  - [x] Autocomplete search with debounce for all HCPCS data from RVU.csv.
  - [x] When an HCPCS is selected, it should provide all other data (DESCRIPTION, STATUS CODE, WORK RVU) to the parent component, but this data is not displayed in the picker itself.
- [x] Create FavoritesPicker component
  - [x] Allows users to add/remove HCPCS codes.
  - [x] Displays a list of the user's favorite HCPCS codes.
  - [x] Clicking a favorite should select it.
- [x] Create EntryForm component
  - [x] Integrates RVUPicker and FavoritesPicker.
  - [x] When an HCPCS is selected, the form should be populated with the corresponding DESCRIPTION, STATUS CODE, and WORK RVU.
  - [x] Includes a "Save" button to create a new "card" (entry).

---

## Phase 5: Main Application ✅ COMPLETED

- [x] Update main page (`/app/(main)/page.tsx`)
  - [x] Integrates EntryForm to add new entries.
  - [x] Displays a list of all added cards.
  - [x] Each card should display HCPCS, DESCRIPTION, STATUS CODE, and WORK RVU.
  - [x] Each card should have a "Remove" button to delete the card.
  - [x] The list should be filterable by date.
  - [x] Pagination for the card list.
- [x] Create analytics dashboard (`/app/analytics/page.tsx`)
  - [x] Period selector (daily/weekly/monthly/yearly)
  - [x] Date range picker
  - [x] RVU summation display
  - [x] Top HCPCS codes breakdown
  - [x] Simple bar chart (Tailwind)



---

## Current File Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── page.tsx                    # Main authenticated page (COMPLETED)
│   │   └── loading.tsx                 # Loading component
│   ├── analytics/
│   │   └── page.tsx                    # Analytics dashboard (COMPLETED)
│   ├── api/
│   ├── auth/[...nextauth]/
│   │   └── route.ts                # Auth.js handler
│   ├── entries/                    # Entry CRUD (COMPLETED)
│   ├── rvu/search/                 # RVU search (COMPLETED)
│   ├── favorites/                  # Favorites CRUD (COMPLETED)
│   └── analytics/                  # Analytics (COMPLETED)
│   ├── sign-in/
│   │   └── page.tsx                    # Google sign-in page
│   ├── globals.css
│   └── layout.tsx                      # Root layout with SessionProvider
├── components/
│   ├── UserProfile.tsx                 # User profile with sign-out
│   ├── RVUPicker.tsx                   # HCPCS picker (COMPLETED)
│   ├── FavoritesPicker.tsx             # Favorites grid (COMPLETED)
│   └── EntryForm.tsx                   # Entry form (COMPLETED)
├── lib/
│   ├── db.ts                           # Postgres client
│   └── auth.ts                         # Auth.js config
└── types/
    └── index.ts                        # TypeScript interfaces

data/
  RVU.csv                               # RVU codes (19,090 rows)

scripts/
  init-db.sql                           # Database schema
  seed-rvu.ts                           # RVU data seeder

keys/
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
- Database schema and migration scripts (16,876 RVU codes seeded)
- TypeScript types
- Basic project structure
- API routes implementation (entries, favorites, RVU search, analytics)
- UI components (RVU picker, favorites, forms)
- Main application integration
- Analytics dashboard
- **RVU Cache System:**
  - In-memory cache for all 16,852 RVU codes
  - Auto-loads on app startup via `CacheWarmer` component
  - Search performance: ~5ms average query time
  - Cache duration: 24 hours
  - Warmup endpoint: `/api/rvu/warmup`
  - Cache stats headers: `X-Cache-Total`, `X-Cache-Age`
- **Multi-HCPCS Support (Phase 8):**
  - Multiple procedures per visit
  - Quantity tracking for each procedure
  - Favorite management from search results
  - Enhanced RVU calculations with quantity multipliers

**🎉 Application is fully functional and production-ready!**

---

## Phase 9: Mobile-Friendly Quantity Input ✅ COMPLETED

### Goal
Improve quantity input UX on mobile devices with stepper buttons instead of standard number inputs.

### Features Implemented

- [x] **Stepper Button Interface**
  - [x] Replaced number input with [-] [value] [+] button interface
  - [x] Large touch targets (36px × 36px) for mobile accessibility
  - [x] Minimum quantity enforced at 1
  - [x] Smooth hover and active states with Apple-style design

- [x] **Component Updates**
  - [x] Updated `ProcedureList.tsx` with stepper UI
  - [x] Applied to both EntryForm and EditVisitModal
  - [x] Clean, minimal design matching overall UI aesthetic

- [x] **UX Improvements**
  - [x] Clear visual feedback on button press
  - [x] No more keyboard popup on mobile
  - [x] Easier single-digit quantity changes
  - [x] Consistent experience across devices

### Technical Details

**UI Components:**
```tsx
<button onClick={decrease}>−</button>
<div>{quantity}</div>
<button onClick={increase}>+</button>
```

**Benefits:**
- Touch-friendly for mobile users
- No input validation issues
- Clear affordance (obvious what buttons do)
- Prevents invalid input (negative numbers, decimals)

---

## Phase 10: Drag-and-Drop Favorites Reordering ✅ COMPLETED

### Goal
Allow users to reorder their favorite HCPCS codes using drag-and-drop functionality on both desktop and mobile.

### Features Implemented

- [x] **Library Integration**
  - [x] Installed `@dnd-kit` library (core, sortable, utilities)
  - [x] Modern, lightweight drag-and-drop solution
  - [x] Excellent mobile touch support
  - [x] Built-in accessibility features

- [x] **Database Schema**
  - [x] Added `sort_order` column to favorites table
  - [x] Migration script to update existing favorites
  - [x] Index for efficient sorting queries
  - [x] Auto-assignment of sort order for new favorites

- [x] **API Updates**
  - [x] GET `/api/favorites` - Returns favorites sorted by sort_order
  - [x] POST `/api/favorites` - Assigns next sort order automatically
  - [x] PATCH `/api/favorites` - Updates sort order after reordering
  - [x] Immediate persistence to database

- [x] **UI Components**
  - [x] Completely rewrote FavoritesPicker with `@dnd-kit`
  - [x] Visible drag handles (6-dot grip icon)
  - [x] SortableItem component for each favorite
  - [x] Smooth animations during drag
  - [x] Visual feedback (opacity, scale, shadow)

- [x] **UX Features**
  - [x] 8px movement threshold before drag starts (prevents accidental drags)
  - [x] Drag handle only - clicking text still selects favorite
  - [x] Disabled drag for already-selected items
  - [x] Works perfectly on both desktop and mobile
  - [x] Keyboard navigation support for accessibility

### Technical Details

**Dependencies Added:**
```json
"@dnd-kit/core": "^6.x.x",
"@dnd-kit/sortable": "^8.x.x",
"@dnd-kit/utilities": "^3.x.x"
```

**Database Migration:**
```sql
ALTER TABLE favorites ADD COLUMN sort_order INTEGER DEFAULT 0;
CREATE INDEX idx_favorites_user_sort ON favorites(user_id, sort_order);
```

**Sensors Configuration:**
- PointerSensor: Handles mouse and touch input
- KeyboardSensor: Enables keyboard navigation
- Activation constraint: 8px distance threshold

---

## Phase 11: Analytics Improvements ✅ COMPLETED

### Goal
Improve analytics yearly view to automatically show current year data.

### Features Implemented

- [x] **Auto-Date Selection**
  - [x] When selecting "Yearly" period, automatically sets:
    - Start Date: January 1 of current year
    - End Date: December 31 of current year
  - [x] Users can still manually adjust dates if needed

- [x] **Timezone Fix**
  - [x] Fixed year display showing 2024 when data is in 2025
  - [x] Extract year directly from date string to avoid timezone conversion
  - [x] Prevents JavaScript Date timezone issues

### Technical Details

**Implementation:**
```tsx
useEffect(() => {
  if (period === 'yearly') {
    const currentYear = new Date().getFullYear();
    setStartDate(`${currentYear}-01-01`);
    setEndDate(`${currentYear}-12-31`);
  }
}, [period]);
```

**Date Formatting Fix:**
```tsx
if (period === 'yearly') {
  return dateStr.substring(0, 4); // Extract year directly
}
```

---

## Phase 8: Multi-HCPCS Support ✅ COMPLETED

### Goal
Transform the entry system to support multiple HCPCS codes per visit with quantity tracking.

### Features Implemented

- [x] **Database Schema Migration**
  - [x] Created `visits` table (parent record for patient encounters)
  - [x] Created `visit_procedures` junction table (multiple HCPCS per visit)
  - [x] Added `quantity` column for procedure tracking
  - [x] Migrated 16 existing entries to new schema
  - [x] Created backwards-compatible view

- [x] **Multi-Select UI**
  - [x] Updated RVUPicker with multi-select checkboxes
  - [x] Updated FavoritesPicker with multi-select mode
  - [x] "Add Selected (N) Codes" button for batch selection
  - [x] Already-selected code indicators

- [x] **Quantity Management**
  - [x] Quantity input field for each procedure (min: 1)
  - [x] Real-time RVU calculation: Quantity × Unit RVU
  - [x] Display: Unit RVU, Quantity, and Total RVU
  - [x] Editable quantities before saving

- [x] **Favorite Management**
  - [x] Star buttons (★/☆) in search results
  - [x] One-click favorite toggle from search
  - [x] Star buttons in procedure lists
  - [x] Real-time sync with FavoritesPicker

- [x] **Visit Display**
  - [x] Expandable visit cards
  - [x] Show multiple procedures per visit
  - [x] Total RVU calculation with quantities
  - [x] Procedure breakdown: Qty × Unit RVU = Total

- [x] **API Updates**
  - [x] POST /api/visits - Create visits with multiple procedures
  - [x] GET /api/visits - Retrieve visits with nested procedures
  - [x] PUT /api/visits/[id] - Update visits
  - [x] DELETE /api/visits/[id] - Delete visits (cascade)
  - [x] Updated analytics to join visits + procedures

### Technical Details

**New Database Tables:**
```sql
visits (id, user_id, date, notes, created_at, updated_at)
visit_procedures (id, visit_id, hcpcs, description, status_code, work_rvu, quantity, created_at)
```

**TypeScript Types:**
- `Visit` - Parent visit record with procedures array
- `VisitProcedure` - Individual procedure with quantity
- `VisitFormData` - Form state for building visits

**User Workflow:**
1. Search/select multiple HCPCS codes
2. Adjust quantities for each procedure
3. Add visit date and optional notes
4. Save visit - all procedures saved together
5. View expandable visit cards with procedure breakdowns

---

## Phase 6: Enhanced Analytics Dashboard ✅ COMPLETED

### Goal
Create comprehensive analytics views with RVU summations grouped by date periods and HCPCS codes.

### Features Implemented

- [x] **Daily Analytics**
  - [x] Sum of RVUs grouped by date
  - [x] Breakdown by HCPCS code for each day
  - [x] Display top procedures per day

- [x] **Weekly Analytics**
  - [x] Sum of RVUs grouped by week
  - [x] HCPCS breakdown for each week
  - [x] Week selection UI with date range

- [x] **Monthly Analytics**
  - [x] Sum of RVUs grouped by month
  - [x] HCPCS breakdown for each month
  - [x] Monthly comparison view

- [x] **Yearly Analytics**
  - [x] Sum of RVUs grouped by year
  - [x] HCPCS breakdown for each year
  - [x] Annual trends visualization

### Technical Implementation

- [x] **API Enhancements**
  - [x] Updated `/api/analytics` to support grouping by HCPCS
  - [x] Added query parameters: `groupBy=hcpcs`, `period=daily|weekly|monthly|yearly`
  - [x] Returns structured data with period, HCPCS, description, count, and total RVU

- [x] **UI Components**
  - [x] Period selector dropdown (Daily/Weekly/Monthly/Yearly)
  - [x] Date range picker with start and end dates
  - [x] Summary cards showing total RVUs, entries, and averages
  - [x] Breakdown table with HCPCS details (code, description, count, RVU)
  - [x] Two-view system: Summary View and HCPCS Breakdown View

- [x] **Data Visualization**
  - [x] Interactive bar chart for RVU trends over time
  - [x] Drill-down capability (click bar to see HCPCS breakdown)
  - [x] Detailed breakdown table with period filtering
  - [x] Responsive design for mobile/tablet

---

## Phase 7: Environment Configuration ✅ COMPLETED

### Goal
Implement proper environment configuration for development and production deployments.

### Features Implemented

- [x] **Separate Environment Files**
  - [x] Created `.env.development` for local development (localhost:3001)
  - [x] Created `.env.production` template for Vercel deployment
  - [x] Updated `.env.example` with comprehensive documentation
  - [x] Removed `.env.local` to avoid environment precedence conflicts

- [x] **Configuration Documentation**
  - [x] Database connection strings (Neon Postgres)
  - [x] Auth.js configuration (AUTH_SECRET, NEXTAUTH_URL)
  - [x] Google OAuth credentials (separate for dev/prod)
  - [x] Clear instructions for setup and deployment

- [x] **Security Enhancements**
  - [x] Updated `.gitignore` to protect environment files
  - [x] Added `config/` directory to `.gitignore`
  - [x] Protected `.env.development` and `.env.production`
  - [x] Kept `.env.example` tracked for documentation

- [x] **OAuth Configuration Fix**
  - [x] Added `trustHost: true` to Auth.js config for localhost
  - [x] Configured separate OAuth apps in Google Cloud Console
  - [x] Fixed redirect_uri_mismatch error
  - [x] Verified authentication works in development

### Deployment Configuration

**Development (localhost:3001):**
- Uses `.env.development` automatically (Next.js auto-detection)
- Google OAuth app: `dev-oauth.json`
  - Client ID: `386826311054-0irihu7h7uc7ft0nfoh47l393dko7u6d`
  - Redirect URI: `http://localhost:3001/api/auth/callback/google`
- ✅ Authentication working

**Production (Vercel):**
- Environment variables set in Vercel Dashboard
- Production URL: `https://hh-ncadsxhvs-projects.vercel.app`
- Google OAuth app: `prod-auth.json`
  - Client ID: `386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l`
  - Redirect URI: `https://hh-ncadsxhvs-projects.vercel.app/api/auth/callback/google`

### OAuth Configuration Files

Located in `configs/` directory (gitignored):
- `configs/dev-oauth.json` - Development OAuth credentials
- `configs/prod-auth.json` - Production OAuth credentials

### Next Steps for Production

1. ✅ OAuth apps already created in Google Cloud Console
2. Update production redirect URI in Google Cloud Console:
   - Add: `https://hh-ncadsxhvs-projects.vercel.app/api/auth/callback/google`
3. Update Vercel environment variables with values from `.env.production`
4. Redeploy to Vercel

---

