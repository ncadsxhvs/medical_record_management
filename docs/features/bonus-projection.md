# Bonus Projection

## Status
- **Branch:** feat/rvu-target
- **Shipped:** 2026-04-01
- **Owner:** Claude Code
- **Related:** `docs/FEATURE_LOG.md` Entry 17

## Purpose
A panel on the Analytics screen that lets a clinician define an RVU production target over a custom date range, then projects how their **current pace** of RVUs translates into a **full-year bonus** and a **prorated bonus for the target period**. Helps users see whether they are on track to hit their incentive target.

## User Story
As a physician tracking RVU production, I want to enter my annual RVU target and bonus rate, so that I can see in real time whether my current pace will earn the bonus and how much money I am on track to make.

## User Flow
1. User navigates to the Analytics screen.
2. User selects a date range (start date, end date) and a period grouping (daily/weekly/monthly/yearly) — these drive the analytics data.
3. The `Bonus Projection` panel appears below the summary stats. It is collapsed by default.
4. User taps the panel header to expand it.
5. User enters an **RVU target** (e.g. `4000`).
6. User picks a **target period start date** and **target period end date** via two date pickers (defaults: Jan 1 – Dec 31 of the current year).
7. User enters a **bonus rate** in dollars per RVU (e.g. `35`).
8. As inputs change, the result cards and progress bar update live.
9. Settings persist — the next time the user visits the screen, their inputs are pre-filled.

## UI Specification (platform-agnostic)

Screen tree:
```
Analytics screen
└── Bonus Projection card (collapsible)
    ├── Header
    │   ├── Title: "Bonus Projection"
    │   └── Chevron icon (rotates when expanded)
    ├── Inputs grid (4 columns on wide screens, 1 column on narrow)
    │   ├── RVU Target          (number input)
    │   ├── Target Period Start (date picker)
    │   ├── Target Period End   (date picker)
    │   └── Bonus Rate ($/RVU)  (number input)
    ├── Caption (small grey text):
    │     "Target: <target> RVUs over <N> days (<start> to <end>)"
    ├── Progress bar (only when annualTarget > 0)
    │   ├── Top row: "Annualized Pace: X RVUs"   "Target: Y RVUs/yr"
    │   ├── Bar (blue if < 100%, green if >= 100%)
    │   └── Caption: "Z% of annual target"
    └── Result cards grid (5 columns on wide screens)
        ├── Actual RVUs       (blue gradient)   — total in data range + "<N> days in range"
        ├── Annualized Pace   (indigo gradient) — annualized RVUs/yr
        ├── Projected Surplus (emerald gradient)— RVUs above target/yr
        ├── Annual Bonus      (amber gradient)  — full-year $ projection
        └── Period Bonus      (purple gradient) — prorated $ for target period length
```

Per-control specs:

| Control | Type | Label | Default | Validation |
|---|---|---|---|---|
| RVU Target | number input | "RVU Target" | empty (treated as 0) | min 0, any decimals, placeholder `e.g. 4000` |
| Target Period Start | date picker | "Target Period Start" | `<currentYear>-01-01` | valid ISO date |
| Target Period End | date picker | "Target Period End" | `<currentYear>-12-31` | valid ISO date, expected >= start |
| Bonus Rate | number input | "Bonus Rate ($/RVU)" | empty (treated as 0) | min 0, any decimals, placeholder `e.g. 35` |
| Header toggle | button | "Bonus Projection" + chevron | collapsed | — |

States:
- **Collapsed** — only header visible.
- **Expanded, no target set** — inputs visible, no progress bar (annualTarget = 0), result cards still render with zeros.
- **Expanded, target set, under pace** — blue progress bar, surplus = 0, bonus = 0.
- **Expanded, target set, on/over pace** — green progress bar, positive surplus and bonus.

## Data Model

```ts
type BonusSettings = {
  rvuTarget: number;        // RVUs, >= 0
  targetStartDate: string;  // ISO YYYY-MM-DD
  targetEndDate: string;    // ISO YYYY-MM-DD
  bonusRate: number;        // dollars per RVU, >= 0
};
```

Inputs from the parent screen (analytics data range):
```ts
type AnalyticsRow = { period_start: string; total_work_rvu: number; ... };

type Props = {
  data: AnalyticsRow[]; // already-filtered analytics rows for the current date range
  startDate: string;    // ISO YYYY-MM-DD — analytics range start
  endDate: string;      // ISO YYYY-MM-DD — analytics range end
};
```

## Persistence
- **Where:** browser `localStorage` (web). On iOS, use `@AppStorage` / `UserDefaults`.
- **Key:** `rvu-bonus-settings`
- **Value:** JSON-encoded `BonusSettings`
- **Lifetime:** permanent until user clears storage
- **Migration:** if a stored object has a legacy `targetPeriod` field (old monthly/quarterly/yearly enum) and no `targetStartDate`, replace with defaults (`Jan 1 – Dec 31` of current year).

## API Contracts
None. This feature is **purely client-side**. It consumes analytics data already loaded by the parent screen.

## Business Logic / Algorithms

All dates use **local-time parsing** (no UTC shift). All durations are inclusive of both endpoints.

```
// 1. Days in the analytics data range (driven by parent screen)
daysInRange    = floor((endDate - startDate) / 1 day) + 1
                 // clamp to >= 1 to avoid divide-by-zero

// 2. Actual RVUs observed in that range
actualRvus     = sum(row.total_work_rvu for row in data)

// 3. Annualized pace based on the observed range
dailyRate      = actualRvus / daysInRange
annualizedRvus = dailyRate * 365

// 4. Days in the user's target period
daysInTarget   = floor((targetEndDate - targetStartDate) / 1 day) + 1
                 // clamp to >= 1

// 5. Normalize the user-entered target to an annual figure
annualTarget   = rvuTarget * (365 / daysInTarget)

// 6. Surplus and bonus
surplus        = max(0, annualizedRvus - annualTarget)
projectedBonus = surplus * bonusRate         // full-year $
proratedBonus  = projectedBonus * (daysInTarget / 365)  // $ for target period

// 7. Progress bar
progressPct    = annualTarget > 0
                   ? min(100, (annualizedRvus / annualTarget) * 100)
                   : 0
```

Display formatting:
- RVU values: 1 decimal (`12345.6`) or 2 decimals for "Actual RVUs"
- Currency: locale-formatted with no fractional digits, prefixed `$`
- Progress %: 1 decimal

## Edge Cases & Error States
- **Empty analytics data** → `actualRvus = 0`, `annualizedRvus = 0`, surplus = 0, bonus = 0. Cards still render.
- **Single-day analytics range** → `daysInRange = 1`; pace = actualRvus * 365.
- **Single-day target period** → `daysInTarget = 1`; annual target = rvuTarget * 365.
- **End date before start date (target)** → currently allowed; clamp `daysInTarget` to >= 1. (iOS implementation should validate and surface an error.)
- **Non-numeric / negative target or rate** → `parseFloat(...) || 0` coerces to 0.
- **No saved settings** → load defaults (Jan 1 – Dec 31 of current year, target = 0, rate = 0).
- **Legacy stored format** → migrate (see Persistence).

## Acceptance Criteria
- [ ] Panel renders below `SummaryStats` on the Analytics screen.
- [ ] Panel is collapsed on first render; chevron rotates 180° when expanded.
- [ ] All four inputs are present and editable.
- [ ] Defaults: target start = Jan 1 of current year, target end = Dec 31 of current year, target = 0, rate = 0.
- [ ] Caption under the inputs displays target RVUs, day count, and ISO date range.
- [ ] Progress bar appears only when `annualTarget > 0`; turns green at >= 100%.
- [ ] All five result cards render and update live as inputs change.
- [ ] `proratedBonus` equals `projectedBonus * daysInTarget / 365` exactly.
- [ ] Settings persist across reloads.
- [ ] Legacy `{targetPeriod: 'monthly'|...}` storage is migrated to defaults without crashing.
- [ ] No network calls are made by this component.

## Test Plan
- **Unit:**
  - Pure calculation function returns correct surplus, projectedBonus, proratedBonus for known inputs.
  - Migration helper drops legacy `targetPeriod` and supplies defaults.
- **Integration:**
  - Mounting the component with a fixed `data` array produces the expected card values.
  - Updating an input updates the displayed result.
  - Persistence: write settings, unmount, remount → inputs are restored.
- **Manual:**
  1. `npm run dev`, sign in, visit `/analytics`.
  2. Pick a date range with known RVUs.
  3. Expand "Bonus Projection".
  4. Enter target = 4000, target period = Jan 1 – Dec 31 of current year, rate = 35.
  5. Verify the four numeric cards and the progress bar update.
  6. Reload the page and confirm inputs are restored from storage.

## iOS / SwiftUI Notes
- **Container:** `DisclosureGroup { ... } label: { Text("Bonus Projection") }` for the collapsible card.
- **Number inputs:** `TextField("RVU Target", value: $settings.rvuTarget, format: .number)` with `.keyboardType(.decimalPad)`.
- **Date pickers:** `DatePicker("Target Period Start", selection: $settings.targetStartDate, displayedComponents: .date)`.
- **Persistence:** `@AppStorage("rvu-bonus-settings")` storing JSON, or a small `UserDefaults` wrapper with a `Codable BonusSettings` struct.
- **Layout:** `LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4))` for the inputs and `count: 5` for the result cards. Use `Adaptive(minimum: 160)` if you want responsive collapse.
- **Progress bar:** `ProgressView(value: progressPct, total: 100).tint(progressPct >= 100 ? .green : .blue)`.
- **Cards:** `RoundedRectangle(cornerRadius: 12).fill(LinearGradient(...))` with overlayed `VStack` for label/value/caption.
- **Currency formatting:** `value.formatted(.currency(code: "USD").precision(.fractionLength(0)))`.
- **Live updates:** mark `BonusSettings` as `@Observable` (Swift 5.9+) so the view recomputes derived values on change.
- **Date math:** use `Calendar.current.dateComponents([.day], from: start, to: end).day! + 1` for inclusive day counts. Avoid `TimeInterval / 86400` (DST drift).

## Files (web reference, for traceability only)
- `src/components/analytics/BonusProjection.tsx`
- `src/app/analytics/page.tsx`
