# Development Tasks
## Google Sheets Viewer (Simplified)

Progress tracker for the minimalist Sheet Viewer application.

---

## Architecture

The app has been simplified to a single-page application that displays Google Sheet records as cards (todo-list style). No workflow, no customization, no templates.

**Core Features:**
- Single page with URL input form
- Load Google Sheet data via API
- Display each row as a card with all columns shown
- Minimalist, clean UI

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

## Phase 1: Google Sheets Integration ✅ COMPLETED

- [x] Create Google Cloud project and service account
- [x] Enable Google Sheets API
- [x] Save credentials to `/config/dongcschen_api_key.json`
- [x] Create `/lib/google-sheets.ts` - Sheets API wrapper
- [x] Create `/api/sheets/read` route
- [x] Create types in `/types/index.ts`

**Service Account:** `google-sheet-sa@data-procs.iam.gserviceaccount.com`

**Test Sheet:** https://docs.google.com/spreadsheets/d/1nWEjy1egu89MEvMy6DyPba7slec8vCwpLa3lbeOEFX8

---

## Phase 2: Simplified UI ✅ COMPLETED

- [x] Create single-page app (`/app/page.tsx`)
  - [x] URL input form
  - [x] Load sheet data on submit
  - [x] Display records as simple cards
  - [x] Show all columns in each card
  - [x] "Load Different Sheet" button to reset
- [x] Update layout.tsx (removed context provider)
- [x] Clean up unused files:
  - [x] Removed `/app/connect/`
  - [x] Removed `/app/mapping/`
  - [x] Removed `/app/customize/`
  - [x] Removed `/app/preview/`
  - [x] Removed `/components/cards/`
  - [x] Removed `/components/ui/`
  - [x] Removed `/lib/context.tsx`
  - [x] Removed `/lib/templates.ts`
  - [x] Removed `/lib/card-generator.ts`
  - [x] Removed `/lib/export.ts`

---

## Current File Structure

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
├── lib/
│   └── google-sheets.ts        # Google Sheets API wrapper
└── types/
    └── index.ts                # TypeScript types

config/
  dongcschen_api_key.json       # Google service account credentials (gitignored)

scripts/
  test-sheets.ts                # Test script for Sheets API
```

---

## Quick Start

```bash
./start.sh           # Start development server
# or
npm run dev
```

**Usage:**
1. Open http://localhost:3000
2. Paste Google Sheet URL
3. Click "Load Sheet"
4. View records as cards

**Note:** Sheet must be shared with `google-sheet-sa@data-procs.iam.gserviceaccount.com`

---

## Future Enhancements (Optional)

- [ ] Search/filter records
- [ ] Sort by column
- [ ] Pagination for large datasets
- [ ] Export to CSV
- [ ] Dark mode toggle
