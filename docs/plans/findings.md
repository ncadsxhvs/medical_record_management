# Findings & Decisions — RVU Tracker

## Requirements
- Google OAuth authentication (web + mobile JWT)
- Multi-procedure visit tracking with HCPCS codes, quantities, RVU values
- No-show encounter tracking (quick-add without procedures)
- Optional visit time tracking (12-hour display)
- Drag-and-drop favorites reordering
- Analytics dashboard (daily/weekly/monthly/yearly, summary + HCPCS breakdown)
- RVU code search across 16,852 codes with autocomplete
- Account deletion
- Privacy policy page
- Interactive API documentation (Swagger UI)

## Architecture

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.0.10 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | v4 |
| Auth | Auth.js (NextAuth) | 5.0.0-beta.30 |
| Database | Neon Postgres | @vercel/postgres 0.10.0 |
| Data Fetching | SWR | 2.3.8 |
| DnD | @dnd-kit | core 6.3.1, sortable 10.0.0 |
| Testing | Jest 30.2.0, RTL 16.3.0, Playwright 1.57.0 |

### Database Schema (6 tables)

**users** — Google OAuth accounts
```sql
id TEXT PRIMARY KEY,        -- Google sub ID
email TEXT UNIQUE NOT NULL,
name TEXT, image TEXT,
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

**visits** — Parent visit records
```sql
id SERIAL PRIMARY KEY,
user_id TEXT REFERENCES users(id),
date DATE NOT NULL,
time TIME,                  -- optional appointment time
notes TEXT,
is_no_show BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
-- Indexes: (user_id, date), (user_id, date, time), (is_no_show)
```

**visit_procedures** — Procedures per visit
```sql
id SERIAL PRIMARY KEY,
visit_id INTEGER REFERENCES visits(id) ON DELETE CASCADE,
hcpcs VARCHAR(10) NOT NULL,
description TEXT NOT NULL,
status_code VARCHAR(2),
work_rvu DECIMAL(10,2) NOT NULL,
quantity INTEGER DEFAULT 1,
created_at TIMESTAMPTZ
```

**favorites** — User favorite HCPCS codes
```sql
id SERIAL PRIMARY KEY,
user_id TEXT REFERENCES users(id),
hcpcs VARCHAR(10) NOT NULL,
sort_order INTEGER DEFAULT 0,
created_at TIMESTAMPTZ
-- UNIQUE(user_id, hcpcs)
-- Indexes: (user_id), (user_id, sort_order)
```

**rvu_codes** — Master code list (seeded from CSV)
```sql
id SERIAL PRIMARY KEY,
hcpcs VARCHAR(10) UNIQUE NOT NULL,
description TEXT NOT NULL,
status_code VARCHAR(2),
work_rvu DECIMAL(10,2) NOT NULL,
created_at TIMESTAMPTZ
-- Indexes: (hcpcs), GIN(description) for full-text search
```

**entries** — Legacy table (deprecated, kept for backward compat)

### File Structure
```
src/
├── app/
│   ├── (main)/page.tsx              # Main page — visit list + form
│   ├── (main)/loading.tsx           # Loading skeleton
│   ├── analytics/page.tsx           # Analytics dashboard
│   ├── sign-in/page.tsx             # Google sign-in
│   ├── privacy/page.tsx             # Privacy policy
│   ├── api-docs/page.tsx            # Swagger UI viewer
│   ├── api-docs/layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/mobile/google/route.ts
│   │   ├── auth/mobile/apple/route.ts
│   │   ├── visits/route.ts          # GET, POST
│   │   ├── visits/[id]/route.ts     # PUT, DELETE
│   │   ├── favorites/route.ts       # GET, POST, PATCH
│   │   ├── favorites/[hcpcs]/route.ts  # DELETE
│   │   ├── rvu/search/route.ts      # GET
│   │   ├── analytics/route.ts       # GET
│   │   └── user/route.ts            # DELETE
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── RVUPicker.tsx                # HCPCS autocomplete
│   ├── FavoritesPicker.tsx          # DnD favorites
│   ├── EntryForm.tsx                # Visit creation form
│   ├── ProcedureList.tsx            # Procedure display
│   ├── EditVisitModal.tsx           # Edit visit modal
│   ├── VisitCard.tsx                # Visit card display
│   ├── UserProfile.tsx              # Profile dropdown
│   ├── CacheWarmer.tsx              # Preload RVU cache
│   ├── SWRProvider.tsx              # SWR config
│   └── analytics/
│       ├── RVUChart.tsx             # Line chart
│       ├── SummaryStats.tsx         # Stat cards
│       └── BreakdownTable.tsx       # HCPCS breakdown
├── hooks/
│   └── useFavorites.ts
├── lib/
│   ├── db.ts                        # Postgres client
│   ├── api-utils.ts                 # withAuth, apiError
│   ├── rvu-cache.ts                 # In-memory cache
│   ├── dateUtils.ts                 # Date utilities
│   ├── mobile-auth.ts              # Mobile JWT auth
│   ├── auth-token.ts               # Token generation
│   ├── cache-keys.ts               # SWR keys
│   ├── fetcher.ts                   # SWR fetcher
│   └── procedureUtils.ts           # Procedure helpers
├── types/index.ts
└── auth.ts                          # Auth.js config
middleware.ts                        # Route protection
```

### API Endpoints Summary
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/visits | session/JWT | List all visits with procedures |
| POST | /api/visits | session/JWT | Create visit (with procedures or no-show) |
| PUT | /api/visits/:id | session/JWT | Update visit + replace procedures |
| DELETE | /api/visits/:id | session/JWT | Delete visit (cascades procedures) |
| GET | /api/favorites | session/JWT | List favorites ordered by sort_order |
| POST | /api/favorites | session/JWT | Add favorite (with next sort_order) |
| PATCH | /api/favorites | session/JWT | Reorder favorites |
| DELETE | /api/favorites/:hcpcs | session/JWT | Remove favorite |
| GET | /api/rvu/search?q= | session/JWT | Search RVU codes |
| GET | /api/analytics?period=&start=&end=&groupBy= | session/JWT | Analytics data |
| DELETE | /api/user | session/JWT | Delete account + all data |
| POST | /api/auth/mobile/google | none | Mobile Google auth → JWT |
| POST | /api/auth/mobile/apple | none | Mobile Apple auth → JWT |

### Input Validation Patterns
```typescript
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const HCPCS_RE = /^[A-Za-z0-9]{4,5}$/;
```

### RVU Cache System
- Loads all 16,852 codes into memory on first request
- 24-hour TTL, auto-refresh
- ~200-500ms initial load, ~5ms search
- Functions: `searchRVUCodes(query, limit)`, `getRVUCodeByHCPCS(code)`, `refreshCache()`, `getCacheStats()`

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| JWT session strategy | Stateless, works with serverless functions |
| In-memory RVU cache | 16K codes too slow to query DB per keystroke |
| parseLocalDate() everywhere | `new Date('YYYY-MM-DD')` interprets as UTC, shifts dates |
| DATE type (not TIMESTAMP) | Visits are date-based, time is separate optional field |
| ON DELETE CASCADE on visit_procedures | Deleting visit auto-cleans procedures |
| ON CONFLICT DO NOTHING for favorites | Prevents duplicate favorites silently |
| SWR over React Query | Lighter, sufficient for this app's needs |
| No global state | useState sufficient, avoids complexity |
| Server components by default | Only `'use client'` when needed (forms, interactivity) |

## Dependencies (Production)
```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@vercel/postgres": "^0.10.0",
  "dotenv": "^17.2.3",
  "google-auth-library": "^10.5.0",
  "lodash": "^4.17.21",
  "next": "16.0.10",
  "next-auth": "^5.0.0-beta.30",
  "react": "^19.2.1",
  "react-dom": "^19.2.1",
  "swr": "^2.3.8"
}
```

## Dependencies (Dev)
```json
{
  "@playwright/test": "^1.57.0",
  "@tailwindcss/postcss": "^4",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "@types/lodash": "^4.17.21",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.0.3",
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "tailwindcss": "^4",
  "tsx": "^4.20.6",
  "typescript": "^5"
}
```

## Environment Variables
```
# Database (Neon Postgres)
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Auth
AUTH_SECRET=              # openssl rand -base64 32
NEXTAUTH_URL=             # http://localhost:3001 or https://trackmyrvu.com

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Resources
- Production: https://trackmyrvu.com
- Vercel: https://hh-ncadsxhvs-projects.vercel.app
- API Docs: https://trackmyrvu.com/api-docs
- OpenAPI Spec: `docs/openapi.yaml`
- RVU Data: `data/RVU.csv` (16,852 codes)
- DB Schema: `scripts/init-db.sql`
