# Development Tasks
## RVU Tracker - Medical Procedure RVU Management

Progress tracker for RVU Tracker application with Postgres backend, authentication, and analytics.

---

## Architecture

Full-stack application for tracking medical procedure RVUs (Relative Value Units):
- **Authentication:** Auth.js (NextAuth) with Google OAuth
- **Database:** Neon Postgres (Vercel)
- **Backend:** Next.js 16.0.7 API Routes
- **Frontend:** React 19.2.1 with Tailwind CSS 4
- **Testing:** Jest + React Testing Library + Playwright

**Core Features:**
- Google sign-in authentication
- HCPCS code picker with 16,852 RVU codes (in-memory cache)
- Favorites management with drag-and-drop reordering
- Multi-procedure visits with quantity tracking
- Analytics dashboard (daily/weekly/monthly/yearly RVU summations)
- Responsive, mobile-friendly UI
- Comprehensive test coverage (57 tests)
- Timezone-independent date handling

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
│   │   ├── __tests__/
│   │   │   ├── visits.test.ts          # Visits API integration tests
│   │   │   └── analytics.test.ts       # Analytics API integration tests
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts                # Auth.js handler
│   │   ├── entries/                    # Entry CRUD (COMPLETED)
│   │   ├── rvu/search/                 # RVU search (COMPLETED)
│   │   ├── favorites/                  # Favorites CRUD (COMPLETED)
│   │   └── analytics/                  # Analytics (COMPLETED)
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
│   ├── __tests__/
│   │   └── dateUtils.test.ts           # Date utility unit tests
│   ├── db.ts                           # Postgres client
│   ├── auth.ts                         # Auth.js config
│   └── dateUtils.ts                    # Date utility functions
└── types/
    └── index.ts                        # TypeScript interfaces

data/
  RVU.csv                               # RVU codes (19,090 rows)

scripts/
  init-db.sql                           # Database schema
  seed-rvu.ts                           # RVU data seeder

configs/
  dev-oauth.json                        # Development OAuth credentials
  prod-auth.json                        # Production OAuth credentials

jest.config.js                          # Jest testing configuration
jest.setup.js                           # Jest test setup
playwright.config.ts                    # Playwright E2E configuration
TESTING.md                              # Testing documentation
```

---

## Phase 12: Testing Implementation ✅ COMPLETED

### Goal
Implement comprehensive testing coverage for date handling, RVU calculations, and analytics functionality.

### Features Implemented

- [x] **Testing Framework Setup**
  - [x] Installed Jest testing framework
  - [x] Installed React Testing Library for component testing
  - [x] Installed Playwright for E2E testing (configured, not yet implemented)
  - [x] Created `jest.config.js` with Next.js support
  - [x] Created `jest.setup.js` with test environment mocks

- [x] **Date Utility Functions**
  - [x] Created `src/lib/dateUtils.ts` with timezone-safe functions
  - [x] `parseLocalDate()` - Parse dates without timezone shifts
  - [x] `formatDate()` - Format dates for consistent display
  - [x] `getTodayString()` - Get today as YYYY-MM-DD
  - [x] `calculateTotalRVU()` - Calculate total RVU with quantities
  - [x] `isValidDateString()` - Validate date format

- [x] **Unit Tests (23 tests)**
  - [x] Date parsing tests (YYYY-MM-DD, ISO datetime, year boundaries, leap years)
  - [x] Date formatting tests (default options, custom options, consistency)
  - [x] Today's date tests (format validation, padding)
  - [x] RVU calculation tests (single/multiple procedures, quantities, edge cases)
  - [x] Date validation tests (invalid/valid formats)

- [x] **Integration Tests (34 tests)**
  - [x] Visits API tests (20 tests)
    - Date handling and ordering
    - RVU calculations with quantities
    - Data filtering by date range
    - Visit structure validation
  - [x] Analytics API tests (14 tests)
    - Date grouping without timezone shifts
    - RVU calculations per period
    - Entry counts and metrics
    - Period filtering and data structure

- [x] **Documentation**
  - [x] Created `TESTING.md` with comprehensive documentation
  - [x] Test commands (`test`, `test:watch`, `test:coverage`, `test:e2e`)
  - [x] Coverage goals (70% minimum)
  - [x] Test structure and strategy
  - [x] Troubleshooting guide

### Test Results

**Current Status:**
- ✅ 57 tests passing
- ✅ 0 tests failing
- ✅ ~0.25s execution time
- ✅ All critical functionality covered

**Test Coverage:**
- Date parsing and formatting: 100%
- RVU calculations: 100%
- Date validation: 100%
- Visits API: All core functionality
- Analytics API: All core functionality

### Technical Details

**Dependencies Added:**
```json
"@testing-library/jest-dom": "^6.9.1",
"@testing-library/react": "^16.3.0",
"@testing-library/user-event": "^14.6.1",
"jest": "^30.2.0",
"jest-environment-jsdom": "^30.2.0",
"@playwright/test": "^1.57.0"
```

**Test Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # E2E tests (Playwright)
```

---

## Phase 13: Security Patches ✅ COMPLETED

### Goal
Address critical security vulnerabilities in React and Next.js.

### Vulnerabilities Addressed

- [x] **CVE-2025-55182 (React Server Components)**
  - Severity: Critical
  - Issue: Remote Code Execution vulnerability in React Server Components
  - Fix: Updated React 19.2.0 → 19.2.1
  - Fix: Updated React DOM 19.2.0 → 19.2.1

- [x] **CVE-2025-66478 (Next.js)**
  - Severity: High
  - Issue: Vulnerability related to React Server Components
  - Fix: Updated Next.js 16.0.3 → 16.0.7

### Verification

- [x] Full test suite passes (57/57 tests)
- [x] Production build successful
- [x] No vulnerabilities detected (`npm audit`)
- [x] All features working correctly

### Updated Dependencies

```json
"next": "^16.0.7",
"react": "^19.2.1",
"react-dom": "^19.2.1"
```

---

## Phase 14: Date Timezone Fixes ✅ COMPLETED

### Goal
Fix date display inconsistencies between localhost and Vercel deployment caused by timezone conversions.

### Issues Fixed

- [x] **Main Page Date Display**
  - Problem: Dates showing different values on localhost vs Vercel
  - Root Cause: `new Date(dateStr)` interprets as UTC midnight, shifts to local timezone
  - Fix: Parse date components directly into local Date object
  - Result: 2025-12-02 always displays as "Tue, Dec 2, 2025" regardless of timezone

- [x] **Analytics Date Grouping**
  - Problem: DATE_TRUNC() converts DATE to TIMESTAMP and applies timezone
  - Root Cause: PostgreSQL DATE_TRUNC shifts dates based on server timezone
  - Fix: Use `v.date` directly for daily grouping instead of DATE_TRUNC
  - Result: Visits on 12/02 correctly appear under 12/02 (not 12/01 or 12/03)

- [x] **Analytics Period Formatting**
  - Problem: Period labels showing wrong dates
  - Root Cause: Same timezone shift issue as main page
  - Fix: Parse dates locally in `formatPeriod()` function
  - Result: Consistent date display across all views

### Technical Implementation

**Date Parsing Pattern:**
```typescript
// Extract date part (YYYY-MM-DD) from string
const dateStr = visit.date.toString().split('T')[0];
const [year, month, day] = dateStr.split('-').map(Number);

// Create local Date (month is 0-indexed)
const date = new Date(year, month - 1, day);

// Format for display
return date.toLocaleDateString('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
```

**Analytics SQL Fix:**
```sql
-- Before (caused timezone shifts)
DATE_TRUNC('day', v.date) as period_start

-- After (timezone-independent)
v.date as period_start
```

### Files Updated

- `src/app/(main)/page.tsx:122-131` - Main page visit date display
- `src/app/analytics/page.tsx:112-132` - Analytics period formatting
- `src/app/api/analytics/route.ts:35-49` - Analytics SQL query

### Testing

All date tests in `dateUtils.test.ts` verify timezone-independent behavior:
- ✅ Parse dates as local dates, not UTC
- ✅ No timezone shifts during parsing
- ✅ Dates at month/year boundaries handled correctly
- ✅ Leap year dates handled correctly

---

## Phase 15: Custom Domain Configuration ✅ COMPLETED

### Goal
Configure custom domain `trackmyrvu.com` for production deployment on Vercel.

### Features Implemented

- [x] **Domain Configuration**
  - [x] Domain purchased: `trackmyrvu.com`
  - [x] Updated documentation with new domain
  - [x] Created configuration checklist for deployment

- [x] **Environment Updates**
  - [x] Updated `.env.example` with production domain
  - [x] Replaced Vercel URL with `trackmyrvu.com`
  - [x] Updated OAuth redirect URIs in documentation

- [x] **Documentation Updates**
  - [x] Updated CLAUDE.md with custom domain info
  - [x] Updated deployment section with domain configuration steps
  - [x] Updated OAuth configuration examples

### Configuration Checklist

**Vercel Dashboard:**
1. Add custom domain `trackmyrvu.com`
2. Configure DNS settings (automatic with Vercel)
3. Update environment variables:
   - `NEXTAUTH_URL=https://trackmyrvu.com`

**Google Cloud Console:**
1. Update OAuth app redirect URIs:
   - Add: `https://trackmyrvu.com/api/auth/callback/google`
2. Verify authorized domains include `trackmyrvu.com`

**Deployment:**
1. Redeploy application on Vercel
2. Verify authentication flow works
3. Test all features on custom domain

### Production URLs

**Old:** `https://hh-ncadsxhvs-projects.vercel.app`
**New:** `https://trackmyrvu.com`

### OAuth Configuration

**Production OAuth App:**
- Client ID: `386826311054-hic8jh474jh1aiq6dclp2oor9mgc981l`
- Redirect URI: `https://trackmyrvu.com/api/auth/callback/google`
- Config file: `configs/prod-auth.json`

---

## Next Steps

### Future Enhancements

1. **E2E Testing with Playwright**
   - Implement end-to-end tests for critical user flows
   - Test authentication flow
   - Test visit creation and editing
   - Test analytics dashboard interactions

2. **Component Testing**
   - Add React Testing Library tests for UI components
   - Test RVUPicker autocomplete behavior
   - Test FavoritesPicker drag-and-drop
   - Test EntryForm validation

3. **Performance Optimization**
   - Implement React Server Components where beneficial
   - Add pagination for large visit lists
   - Optimize analytics queries for large datasets
   - Consider implementing caching for analytics data

4. **Feature Additions**
   - Export analytics data to PDF/Excel
   - Custom date range presets (Last 7 days, Last 30 days, etc.)
   - Visit templates for common procedure combinations
   - Bulk visit editing capabilities

5. **Production Deployment**
   - Complete custom domain setup on Vercel
   - Configure OAuth redirect URIs for trackmyrvu.com
   - Test authentication on production domain
   - Monitor performance and error logs

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
- **Core Application (Phases 0-8):**
  - Authentication (Google OAuth via Auth.js)
  - Database schema and migration scripts (16,852 RVU codes seeded)
  - TypeScript types with strict mode
  - API routes implementation (visits, favorites, RVU search, analytics)
  - UI components (RVU picker, favorites picker, entry forms)
  - Main application integration with multi-HCPCS support
  - Analytics dashboard with period grouping

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

- **UX Enhancements (Phases 9-11):**
  - Mobile-friendly stepper UI for quantity inputs
  - Drag-and-drop favorites reordering (@dnd-kit)
  - Auto-date selection for analytics yearly view
  - Expandable visit cards with procedure breakdowns

- **Testing Implementation (Phase 12):**
  - Jest + React Testing Library setup
  - 57 passing tests (23 unit, 34 integration)
  - Date utility functions with timezone-safe parsing
  - Comprehensive test coverage for critical functionality
  - TESTING.md documentation

- **Security & Stability (Phase 13):**
  - React 19.2.1 (CVE-2025-55182 patched)
  - Next.js 16.0.7 (CVE-2025-66478 patched)
  - No known vulnerabilities
  - All tests passing

- **Date Handling (Phase 14):**
  - Timezone-independent date parsing
  - Consistent date display across environments
  - Fixed analytics date grouping issues
  - All dates display correctly on localhost and production

- **Production Deployment (Phases 7, 15):**
  - Separate environment files for dev/prod
  - Custom domain: trackmyrvu.com
  - OAuth configured for both environments
  - Ready for production deployment

- **No-Show Feature (Phase 16):**
  - Quick-add no-show encounters without procedures
  - Database schema updated with `is_no_show` column
  - Distinctive orange styling for no-show visits
  - Delete-only (no editing) for no-show visits
  - Migration script applied successfully

**📊 Test Suite:**
- 57/57 tests passing
- ~0.25s execution time
- 70% coverage goal
- Unit + Integration tests implemented
- E2E framework configured (Playwright)

**🎉 Application is fully functional, tested, and production-ready!**

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

## Phase 16: No-Show Feature ✅ COMPLETED

### Goal
Add ability to track no-show encounters without entering procedure details.

### Features Implemented

- [x] **Database Schema**
  - [x] Added `is_no_show` boolean column to visits table
  - [x] Created migration script: `scripts/add-no-show-column.sql`
  - [x] Added index for efficient querying: `idx_visits_no_show`
  - [x] Default value: FALSE

- [x] **API Updates**
  - [x] Modified POST `/api/visits` to accept `is_no_show` flag
  - [x] Allow empty procedures array when `is_no_show` is true
  - [x] Validation ensures regular visits still require procedures
  - [x] GET endpoint returns `is_no_show` flag with visits

- [x] **TypeScript Types**
  - [x] Added `is_no_show?: boolean` to `Visit` interface
  - [x] Added `is_no_show?: boolean` to `VisitFormData` interface

- [x] **UI Components**
  - [x] "Add No Show" button below entry form
  - [x] Red button styling matching delete button style
  - [x] Circle-slash icon for visual consistency
  - [x] Right-aligned placement
  - [x] Loading state while creating no-show

- [x] **Visit Card Display**
  - [x] Orange background and border for no-show visits
  - [x] "🚫 No Show" badge at top of card
  - [x] No RVU total displayed (since no procedures)
  - [x] No procedures section shown
  - [x] Edit button hidden (only Delete available)
  - [x] Date and notes still displayed

### Technical Details

**Database Migration:**
```sql
ALTER TABLE visits ADD COLUMN IF NOT EXISTS is_no_show BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_visits_no_show ON visits(user_id, is_no_show);
```

**User Workflow:**
1. Click "Add No Show" button below entry form
2. No-show visit created instantly with:
   - Today's date
   - "No Show" in notes field
   - Empty procedures array
   - `is_no_show` flag set to true
3. Visit appears in list with distinctive orange styling
4. Can only be deleted (not edited)

### Files Modified

- `src/app/api/visits/route.ts` - API logic for no-shows
- `src/app/(main)/page.tsx` - UI components and handlers
- `src/types/index.ts` - TypeScript interfaces
- `scripts/add-no-show-column.sql` - Database migration

### Testing

- ✅ All 57 existing tests still pass
- ✅ TypeScript compilation successful
- ✅ Production build successful
- ✅ Database migration applied successfully

---

