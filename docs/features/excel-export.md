# Excel Export

## Status
- **Branch:** feat/email-reminders
- **Shipped:** 2026-05-02
- **Related:** Feature Log Entry 28

## Purpose
Allow users to export their RVU data as an Excel spreadsheet with multiple aggregation levels for reporting and analysis.

## User Flow
1. User navigates to the Analytics page.
2. User selects a date range (preset or custom).
3. User taps the "Export" button next to the period preset chips.
4. Browser downloads an .xlsx file named `rvu-export-{start}-to-{end}.xlsx`.
5. The file contains 4 sheets: Daily, Weekly, Monthly, Annual.

## UI Specification
- **Export button:** pill-shaped, secondary style (white bg, zinc border), icon + text
  - Icon: download/document SVG
  - Text: "Export" (or "Exporting..." while in progress)
  - Disabled state during export
- **Position:** inline with period preset chips (7d, 30d, QTD, YTD, Custom)

## Data Model
Each sheet has the same columns:

```ts
type ExportRow = {
  period: string;      // Date, Week Starting, Month, or Year
  visits: number;      // count of unique encounters (excluding no-shows)
  total_rvu: number;   // sum of work_rvu * quantity, rounded to 2 decimals
  no_shows: number;    // count of no-show encounters
};
```

## Persistence
No persistence — generated on-the-fly from visits + visit_procedures tables.

## API Contracts

### GET /api/export?start=YYYY-MM-DD&end=YYYY-MM-DD
- **Auth:** required (session or JWT)
- **Query params:** start (required), end (required)
- **Response 200:** binary XLSX file
  - Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Content-Disposition: `attachment; filename="rvu-export-{start}-to-{end}.xlsx"`
- **Error 400:** missing start/end params
- **Error 500:** query or generation failure

## Business Logic
- **Daily:** one row per date, aggregated from all visits on that date
- **Weekly:** grouped by week starting Sunday (getDay() === 0)
- **Monthly:** grouped by YYYY-MM
- **Annual:** grouped by YYYY
- **Visit counting:** unique visits identified by date + time combination
- **No-show counting:** unique no-shows identified by date + time combination
- **RVU calculation:** `work_rvu * quantity` for each procedure, summed per period
- **Rounding:** `Math.round(n * 100) / 100`
- **Sort order:** newest first in all sheets
- **XLSX generation:** uses `xlsx` library with `type: 'array'`, returned as `Uint8Array`

## Edge Cases
- No data in range: sheets created with empty rows
- Visit with no procedures: counted as visit with 0 RVU
- Time column is NULL: coalesced to empty string via `v.time::text`
- Network failure during download: caught in client, logged to console

## Acceptance Criteria
- [ ] Export button appears on analytics page next to period chips
- [ ] Clicking export downloads a valid .xlsx file
- [ ] File contains 4 sheets: Daily, Weekly, Monthly, Annual
- [ ] Each sheet has columns: period label, Visits, Total RVU, No Shows
- [ ] Data matches the analytics page totals for the same date range
- [ ] Button shows "Exporting..." and is disabled during download

## iOS / SwiftUI Notes
- Use `ShareLink` or `UIActivityViewController` to share the generated file
- Generate XLSX using a Swift library (e.g., xlsxwriter or CoreXLSX)
- Or generate CSV as simpler alternative for iOS
- Export button maps to a toolbar button or action menu item

## Files (web reference)
- `src/app/api/export/route.ts` — export API endpoint
- `src/app/analytics/page.tsx` — export button UI and download handler
