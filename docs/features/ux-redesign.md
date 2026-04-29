# UX Redesign: Split Panel Layout

## Status
- **Branch:** feat/addbutton-for-fav
- **Shipped:** 2026-04-29
- **Related:** Entry 22 in FEATURE_LOG.md

## Purpose
Restructure the main page from a single vertical scroll into a two-panel split layout optimized for high-volume data entry during clinic hours. Add at-a-glance KPI metrics and replace all browser native dialogs with custom UI components.

## User Flow
1. User opens main page on desktop (≥1024px viewport).
2. Left panel shows persistent entry form: search, favorites, procedure list, date/time/notes, save button.
3. Right panel shows KPI strip (Today, This Week, Month to Date RVUs) and visit feed grouped by date.
4. User searches for HCPCS code or taps a favorite → procedure appears in "Selected" card with quantity controls.
5. Running total updates live as procedures are added/removed/adjusted.
6. User clicks "Save Visit" → success toast appears bottom-right, visit appears in right feed.
7. User hovers a visit row → edit/copy/delete icons appear. Clicking row expands procedure details.
8. User clicks delete → custom confirmation dialog appears (not browser confirm).
9. On mobile (<1024px) → layout stacks vertically: form on top, feed below.

## UI Specification

### Layout
```
Header Bar (full width, white, border-bottom)
├── Title "RVU Tracker"
├── Spacer
├── Analytics button
└── UserProfile (name + sign out)

Split Panel (flex row on lg+, flex col on mobile)
├── Left Panel (420-460px, white bg, sticky, scrollable)
│   ├── FavoriteGroups section
│   ├── Search HCPCS (text input)
│   ├── Favorites (grid of favorite codes)
│   ├── Selected Procedures (sky-blue card)
│   │   ├── Procedure rows (code, desc, qty ±, RVU, remove)
│   │   └── Total row
│   ├── Date + Time (2-col grid)
│   ├── Notes (single-line text input)
│   └── Save Visit + No Show buttons
│
└── Right Panel (flex-1, stone-50 bg)
    ├── KPI Strip (3-col grid)
    │   ├── Today RVU
    │   ├── This Week RVU
    │   └── Month to Date RVU (+ On Track / Below Target pill)
    └── Visit Feed (grouped by date)
        ├── Date header ("Today", "Apr 28")
        └── Visit rows (accent dot, time, codes, RVU, hover actions)
```

### KPI Strip
- **Type:** 3-column grid of metric cards
- **Each card:** label (uppercase xs), value (lg bold mono)
- **Month to Date:** includes tracking pill if bonus target is set
  - Green "On Track" if actual ≥ expected pace
  - Amber "Below Target" if actual < expected pace
- **Data source:** computed client-side from visits array (no API call)

### Visit Card (compact row)
- **Default:** single line — colored dot, time (12h format), procedure codes, RVU value
- **Hover:** edit/copy/delete icon buttons appear
- **Click:** expands to show procedure details with quantities and RVU math
- **No-show variant:** orange background, "NO SHOW" badge, delete-only action

### Toast Notifications
- **Position:** fixed bottom-right
- **Variants:** success (green), error (red), info (dark)
- **Auto-dismiss:** 3 seconds
- **Usage:** visit saved, visit deleted, errors, info messages

### Confirm Dialog
- **Type:** modal overlay with backdrop blur
- **Props:** title, message, confirm label, variant (danger/default)
- **Usage:** delete visit confirmation, delete group confirmation

## Data Model
No new data models. Uses existing `Visit`, `VisitProcedure`, `BonusSettings`.

```ts
type BonusSettings = {
  rvuTarget: number;
  targetStartDate: string;  // YYYY-MM-DD
  targetEndDate: string;    // YYYY-MM-DD
  bonusRate: number;        // $/RVU
};
```

## Persistence
- **KPI data:** computed from visits (already fetched via SWR)
- **On Track indicator:** reads bonus settings from localStorage key `rvu-bonus-settings`
- **Shared loader:** `src/lib/bonusSettings.ts` (used by both KPIStrip and BonusProjection)

## Business Logic

### KPI Calculations
```
todayRVU  = sum(visit.procedures[].work_rvu * quantity) where visit.date == today
weekRVU   = same filter for Monday–Sunday of current week
monthRVU  = same filter for 1st–last of current calendar month
```

### On Track Indicator
```
totalDays = targetEndDate - targetStartDate (in days)
elapsed   = today - targetStartDate (in days)
expected  = rvuTarget * (elapsed / totalDays)
actual    = sum of RVUs from targetStartDate to today
onTrack   = actual >= expected
```

## Edge Cases
- No visits → KPI shows 0.00, empty state message in feed
- No bonus target set (rvuTarget = 0) → tracking pill hidden
- Target period hasn't started yet → tracking pill hidden
- Mobile viewport → stacked layout, left panel scrolls normally (not sticky)
- Visit with no time → time column shows empty in feed row

## Acceptance Criteria
- [ ] Desktop shows two-panel split layout at ≥1024px
- [ ] Mobile stacks panels vertically at <1024px
- [ ] Left panel is sticky and independently scrollable on desktop
- [ ] KPI strip shows correct Today / This Week / Month to Date values
- [ ] On Track pill appears when bonus target > 0
- [ ] Selected procedures show inline with quantity ± controls
- [ ] Running total updates live
- [ ] Save Visit shows success toast
- [ ] Delete Visit shows custom ConfirmDialog
- [ ] No browser alert() or confirm() calls remain in src/
- [ ] All 80 existing tests pass
- [ ] Build passes with no TypeScript errors

## iOS / SwiftUI Notes
- Split panel → `NavigationSplitView` (sidebar + detail)
- KPI strip → `HStack` of 3 metric `VStack` cards
- Toast → custom `overlay` with `withAnimation` and auto-dismiss via `DispatchQueue.main.asyncAfter`
- ConfirmDialog → `.confirmationDialog` modifier
- Sticky left panel → default `NavigationSplitView` behavior
- Visit feed grouped by date → `List` with `Section(header:)`
- Hover actions → `.swipeActions` on list rows

## Files
- `src/app/(main)/page.tsx` — split panel layout
- `src/components/EntryForm.tsx` — stacked form for left panel
- `src/components/VisitCard.tsx` — compact row with hover actions
- `src/components/KPIStrip.tsx` — metrics strip
- `src/components/Toast.tsx` — toast system
- `src/components/ConfirmDialog.tsx` — confirmation dialog
- `src/lib/bonusSettings.ts` — shared settings loader
- `src/app/layout.tsx` — ToastProvider
- `src/app/globals.css` — design tokens
