# Productivity View

## Status
- **Branch:** feat/addbutton-for-fav
- **Shipped:** 2026-04-30
- **Related:** Feature Log Entry 24

## Purpose
A personal productivity dashboard for doctors to see daily rhythm, pace to monthly RVU goal, streak tracking, peer comparison, and actionable coaching suggestions. Complements the Analytics page (which focuses on historical data and HCPCS breakdowns) with a motivational, at-a-glance view.

## User Flow
1. User taps "Productivity" in the top navigation bar.
2. Page loads visit data and bonus settings (RVU target from localStorage).
3. User sees an editorial headline summarizing their week ("You're having a strong week" or "a slow week").
4. Three score rings show today's RVU vs. daily target, monthly pace %, and a composite productivity score.
5. Below: today's hour-by-hour rhythm chart, hit-target streak grid, 12-week trend, peer comparison, and coaching suggestions.
6. All metrics are computed client-side from the same visit data used on the Log page.

## UI Specification

### Editorial Headline
- Large heading: "You're having _a strong/slow week_."
- Italic verdict colored green (on pace) or amber (behind pace).
- Subtitle: formatted date, today's visit count, yesterday's visit count.

### Score Rings (3-column grid on desktop, stacked on mobile)
| Ring | Value | Sublabel | Color Logic |
|------|-------|----------|-------------|
| Today RVU | `todayRVU.toFixed(1)` | "RVU today" | Green if ≥60% of daily target, else amber |
| Monthly Pace | `monthPct.toFixed(0)%` | "Monthly pace" | Indigo always |
| Productivity Score | composite 0–100 | "Productivity score" | Green always |

Each ring: SVG circle with background track + colored arc (strokeDasharray). Center text shows value + sublabel.

Caption below each ring provides context (e.g., "X% of Y daily target", "X of Y · projected Z").

### Today's Rhythm
- Horizontal bar chart, one bar per hour from 8am to 5pm.
- Bar height proportional to RVU summed from visits in that hour.
- Green bars for hours with ≥4 RVU; dark bars otherwise.
- Future hours (after current time) shown at 40% opacity.
- Value labels above bars. Hour labels below.
- Header shows most productive hour, total RVU, avg/hr.

### Hit-Target Streak
- 14-cell grid (last 14 days). Each cell is a square.
- Green = hit daily target, zinc = miss, indigo = today (if hit).
- Large number showing current streak + "day streak · best N".
- Footer: "2 weeks ago" / "Today".

### 12-Week Trend
- 12 vertical bars for last 12 ISO weeks.
- Current week = indigo. Above target = green. Below target = dark.
- Dashed horizontal line at target value.
- Trending percentage in header (green if positive, red if negative).

### Peer Comparison
- 3 bullet-bar metrics: RVU/workday, Avg/encounter, Days to goal.
- Each metric: label, user value (indigo) vs. peer value (gray).
- Stacked horizontal bars: thin peer bar behind, thicker user bar in front.
- Peer data is placeholder (static values) for now.

### Coaching Suggestions
- 3-column card grid (single column on mobile).
- Each card: colored dot, bold title, descriptive body text.
- Insights computed from visit data:
  1. Peak day of week (green dot)
  2. G2211 add-on opportunity count (amber dot)
  3. End-of-day RVU drop percentage (indigo dot)

## Data Model

```ts
// Reuses existing Visit type from /api/visits
type Visit = {
  id: number;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM:SS
  is_no_show?: boolean;
  procedures: VisitProcedure[];
};

type VisitProcedure = {
  hcpcs: string;
  work_rvu: number;
  quantity: number;
  description: string;
};

// Bonus settings from localStorage
type BonusSettings = {
  rvuTarget: number;       // Monthly target (default 480)
  targetStartDate: string;
  targetEndDate: string;
  bonusRate: number;
};
```

## Persistence
- Visit data: fetched from `/api/visits` via SWR (same as Log page).
- RVU target: read from localStorage key `rvu-bonus-settings` via `loadBonusSettings()`.
- No new API endpoints or database changes.

## API Contracts
No new endpoints. Reuses `GET /api/visits` (returns all visits for authenticated user).

## Business Logic

### Daily Target
```
monthsInPeriod = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
monthlyTarget = rvuTarget / monthsInPeriod
dailyTarget = monthlyTarget / 22  (workdays per month)
weeklyTarget = dailyTarget * 5
```
Example: 6000 RVU target, Jan 1–Dec 31 → 6000/12 = 500/month → 500/22 = 22.7/day

### Monthly Pace
```
monthRVU = sum of all visit RVUs in current month
monthPct = (monthRVU / monthlyTarget) * 100
workdaysElapsed = count of unique visit dates in current month
projection = (monthRVU / workdaysElapsed) * workdaysTotal
onPace = monthPct >= expectedPct - 3
```

### Productivity Score (composite)
```
score = min(round(todayPct * 0.3 + monthPct * 0.5 + (onPace ? 20 : 0)), 100)
```

### Streak Calculation
- Look at last 14 days. Sum RVU per day. Compare to dailyTarget.
- Current streak = consecutive hit days from today backwards.
- Best streak = longest consecutive hit sequence in the 14-day window.

### Trend Percentage
```
trendPct = ((lastWeekRvu - firstNonZeroWeekRvu) / firstNonZeroWeekRvu) * 100
```

### Coaching: Peak Day
- Group visits by day-of-week, compute avg RVU per day.
- Compare peak day average to overall average.

### Coaching: G2211 Opportunity
- Count visits with qualifying E/M codes (99213–99215, 99203–99205).
- Count how many of those also have G2211.
- Missed = qualified - hasG2211.

### Coaching: End-of-Day Drop
- Compare avg RVU/visit before 4pm vs. after 4pm.
- Drop % = (earlyAvg - lateAvg) / earlyAvg * 100.

## Edge Cases
- No visits: score rings show 0, rhythm chart shows empty bars, streak = 0.
- No bonus settings configured: defaults to 480 RVU/month target.
- No visits with time field: rhythm chart shows all empty, coaching insights handle gracefully.
- Division by zero: guarded with Math.max(denominator, 1) or 0.1.
- First week of month with 0 workdays elapsed: defaults to 1.

## Acceptance Criteria
- [ ] `/productivity` page renders with auth guard (redirects to sign-in if unauthenticated)
- [ ] Three score rings display correct values from visit data
- [ ] Today's rhythm shows bars for hours with visits
- [ ] Streak grid shows last 14 days with correct hit/miss coloring
- [ ] 12-week trend shows weekly bars with target line
- [ ] Peer comparison shows 3 metrics with bullet bars
- [ ] Coaching suggestions show 3 computed insights
- [ ] Navigation links work between Log, Analytics, and Productivity on all 3 pages
- [ ] Responsive: single-column on mobile, multi-column on desktop
- [ ] `npm run build` passes
- [ ] 80/80 existing tests pass

## iOS / SwiftUI Notes
- Score rings: use SwiftUI `Circle().trim(from:to:)` with `.stroke()` for the arc.
- Bar charts: use `GeometryReader` with proportional frame heights, or Charts framework `BarMark`.
- Streak grid: `LazyVGrid(columns: Array(repeating: .init(.flexible()), count: 14))`.
- Peer comparison: `ZStack` with two `RoundedRectangle` bars at different widths.
- Use `@AppStorage("rvu-bonus-settings")` for target persistence (or UserDefaults).
- Fetch visits from the same `/api/visits` endpoint.
- All business logic formulas above are platform-agnostic.

## Files (web reference)
- `src/app/productivity/page.tsx` — main page with auth, SWR, layout
- `src/components/productivity/ScoreRing.tsx` — SVG circular progress ring
- `src/components/productivity/TodayRhythm.tsx` — hour-by-hour bar chart
- `src/components/productivity/StreakGrid.tsx` — 14-day hit/miss grid
- `src/components/productivity/WeeklyTrend.tsx` — 12-week bar chart
- `src/components/productivity/PeerComparison.tsx` — bullet bar metrics
- `src/components/productivity/CoachingSuggestions.tsx` — insight cards
