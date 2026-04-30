# UI Consistency & Unified Design System

## Status
- **Branch:** feat/addbutton-for-fav
- **Shipped:** 2026-04-30
- **Related:** PR #33

## Purpose
Unify visual design across all 3 pages (Log, Analytics, Productivity) so header, navigation, accent colors, and container widths are consistent. Provides 3 standalone HTML design templates as reference.

## User Flow
1. User navigates between Log, Analytics, and Productivity pages.
2. Header appears identically on every page: blue circle logo, app title, nav pills, user avatar.
3. Active page is highlighted with a filled blue pill; inactive pages are gray text links.
4. All page content is constrained to the same max-width container.

## UI Specification

### Shared Header (`AppHeader`)
| Element | Type | Details |
|---------|------|---------|
| Logo | Circle badge | 32x32pt, blue fill, white "R" text, bold |
| Title | Text | "RVU Tracker", 18pt, bold, dark gray |
| Nav pills | Horizontal group | 3 items: Log, Analytics, Productivity |
| Active pill | Filled badge | Blue background (#3b82f6), white text, 12pt semibold, rounded-lg |
| Inactive pill | Text link | Gray text (#71717a), 12pt semibold, hover: light gray background |
| User avatar | Component | Right-aligned, shows profile dropdown |
| Container | Max-width | 1400px, centered |
| Border | Bottom | 1px, light gray at 60% opacity |

### Loading State (`AppHeaderSkeleton`)
Same outer shell with animated placeholder rectangles for logo (32x32 circle) and title (128x24 rect).

### Design Tokens (Unified)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Primary | #3b82f6 | blue-500 | Active nav, primary buttons, focus rings |
| Primary hover | #2563eb | blue-600 | Button hover states |
| Success | #059669 | emerald-600 | Positive indicators, on-pace states |
| Caution | #d97706 | amber-600 | Warning states, slow-pace indicators |
| Destructive | #dc2626 | red-600 | Delete buttons, error states |
| Page background | #fafaf9 | stone-50 | All page backgrounds |
| Card background | #ffffff | white | Cards, sidebars |
| Card border | #e4e4e7 at 80% | zinc-200/80 | Card borders |
| Text primary | #18181b | zinc-900 | Headings, body text |
| Text secondary | #71717a | zinc-500 | Subtitles, metadata |
| Text tertiary | #a1a1aa | zinc-400 | Labels, hints |

### Per-Page Changes

**Analytics page:**
- Active period preset chip: blue-500 fill (was zinc-900)
- Container: 1400px max-width (was 1280px)

**Productivity page:**
- Headline accent colors: emerald-600 for positive, amber-600 for caution (was oklch inline styles)
- Score ring colors: emerald-600, blue-600, emerald-600 (was oklch values)
- Container: 1400px max-width (was 1280px)

### HTML Templates
3 self-contained HTML files at `docs/templates/`:
- `home.html` — 3-column layout with sidebar, log visit form, visit feed
- `analytics.html` — period chips, summary cards, chart, top codes, bonus projection
- `productivity.html` — score rings, rhythm chart, streak grid, trend, peer comparison, coaching

Each uses Tailwind CDN, Google Fonts (Figtree headings, Noto Sans body), and the unified design tokens above.

## Data Model
No data model changes. This is a purely visual/structural refactor.

## Persistence
No persistence changes.

## API Contracts
No API changes.

## Business Logic
None. Presentational changes only.

## Edge Cases
- Pages must render identically when navigating between them (no header flash/layout shift).
- Loading skeleton must match the same header width and structure.
- Nav pills must not wrap on mobile (3 items fit within 375px viewport).

## Acceptance Criteria
- [ ] All 3 pages show identical header: blue "R" circle, "RVU Tracker" title, 3 nav pills
- [ ] Active page pill is blue-500 with white text on every page
- [ ] Inactive pills are gray-500 text with hover highlight
- [ ] All pages use max-w-[1400px] container
- [ ] Analytics preset chips use blue-500 active state (not zinc-900)
- [ ] Productivity page has no oklch() inline styles
- [ ] Productivity headline uses emerald-600/amber-600 for pace indicator
- [ ] Score rings use hex colors (#059669, #2563eb)
- [ ] HTML templates render correctly in browser with Tailwind CDN
- [ ] `npm run build` passes with no errors

## iOS / SwiftUI Notes
- **Header**: Use a custom `AppHeaderView` with `HStack` containing logo circle (`Circle().fill(.blue)`), title `Text`, and `ForEach` over nav items. Active item uses `.background(.blue)` capsule; inactive uses plain text.
- **Design tokens**: Define as `Color` extensions in a `DesignTokens.swift` file. Map blue-500 to `Color(hex: "#3b82f6")`, etc.
- **Container width**: Use `.frame(maxWidth: 1400)` with `.padding(.horizontal)` on iPad; full-width on iPhone.
- **Nav**: On iOS, this maps to a `TabView` with 3 tabs (Log, Analytics, Productivity) rather than a top nav bar.

## Files (web reference)
- `src/components/AppHeader.tsx` — shared header component + skeleton
- `src/app/(main)/page.tsx` — uses `<AppHeader activePage="log" />`
- `src/app/analytics/page.tsx` — uses `<AppHeader activePage="analytics" />`, blue-500 preset chips
- `src/app/productivity/page.tsx` — uses `<AppHeader activePage="productivity" />`, hex colors
- `docs/templates/home.html` — HTML design reference
- `docs/templates/analytics.html` — HTML design reference
- `docs/templates/productivity.html` — HTML design reference
