# Analytics Dashboard

## Purpose
Displays RVU trends, encounter counts, and HCPCS breakdowns over configurable date ranges and period groupings for the authenticated user.

## UI Components
- Period selector: dropdown with Daily, Weekly, Monthly, Yearly options
- Date range picker: start/end date inputs, auto-sets Jan 1 - Dec 31 when Yearly selected
- Refresh button: manually re-fetches analytics data via SWR mutate
- View mode tabs: "Summary View" and "HCPCS Breakdown" toggle
- Bar chart: gradient blue bars with green line overlay, horizontal scroll for >5 bars, clickable to drill into breakdown

## Behavior
- Defaults to last 30 days, daily period, summary view
- Clicking a chart bar switches to breakdown view filtered to that period
- "Show All Periods" link clears period filter in breakdown view
- Redirects to `/sign-in` if unauthenticated
- Shows "Loading analytics..." spinner, "No data available" for empty results

## Data / Props
- `GET /api/analytics?period=daily&start=YYYY-MM-DD&end=YYYY-MM-DD` returns `{ period_start, total_work_rvu, total_encounters, total_no_shows }[]`
- `GET /api/analytics?period=daily&start=...&end=...&groupBy=hcpcs` returns `{ period_start, hcpcs, description, status_code, total_work_rvu, total_quantity, encounter_count }[]`
- Summary stats computed client-side: Total RVUs, Total Encounters, Total No Shows, Avg RVU per Encounter
- Daily grouping uses `v.date` directly (no DATE_TRUNC) to avoid timezone shifts; weekly/monthly/yearly use DATE_TRUNC

## File Locations
- Main component: `src/app/analytics/page.tsx`
- API route: `src/app/api/analytics/route.ts`
- Tests: `src/app/api/__tests__/analytics.test.ts`
- Cache keys: `src/lib/cache-keys.ts`

## Dependencies
- `swr` for data fetching with deduplication and caching
- `next-auth/react` (useSession) for auth gating
- `src/lib/fetcher.ts` as SWR fetcher
- `src/lib/dateUtils.ts` for timezone-safe date parsing

## Recreate Checklist
- [ ] Create `GET /api/analytics` route with period/start/end/groupBy params, joining visits + visit_procedures, grouping by DATE_TRUNC (daily uses v.date raw)
- [ ] Create analytics page with period selector, date range inputs, and SWR-powered data fetching
- [ ] Build bar chart with y-axis labels, gridlines, gradient bars, SVG line overlay, and horizontal scroll
- [ ] Add 4 summary stat cards (Total RVUs, Total Encounters, Total No Shows, Avg RVU/Encounter)
- [ ] Add HCPCS breakdown table grouped by period with date header rows, sortable by period DESC then RVU DESC
