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
| Logo | Circle badge | 32x32pt, PlayStation Blue (#0070cc) fill, white "R" text, bold |
| Title | Text | "RVU Tracker", 18pt, font-light (300), white (hidden on mobile) |
| Nav pills | Horizontal group | 3 items: Log, Analytics, Productivity |
| Active pill | Filled badge | PlayStation Blue (#0070cc) bg, white text, 12pt medium, rounded-full (pill) |
| Inactive pill | Text link | White text at 70% opacity, hover: Cyan (#1eaedb), rounded-full |
| User avatar | Component | Right-aligned; mobile: circle initial only; desktop: name + sign-out |
| Container | Max-width | 1400px, centered |
| Background | Solid | Console Black (#000000) |

### Loading State (`AppHeaderSkeleton`)
Same outer shell with animated placeholder rectangles for logo (32x32 circle) and title (128x24 rect).

### Design Tokens — PlayStation-Inspired
| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| Primary (Brand) | #0070cc | --color-ps-blue | Active nav, primary buttons, links, focus rings |
| Primary hover | #005fa3 | --color-ps-blue-hover | Button pressed states |
| Interaction Cyan | #1eaedb | --color-ps-cyan | Hover/focus accent ONLY — never at rest |
| Console Black | #000000 | --color-ps-black | Header/nav background |
| Deep Charcoal | #1f1f1f | --color-ps-charcoal | Body headlines, toast backgrounds |
| Body Gray | #6b6b6b | --color-ps-body-gray | Secondary text, metadata |
| Mute Gray | #cccccc | --color-ps-mute | Disabled states, placeholders |
| Paper White | #ffffff | --color-ps-paper | Card/surface backgrounds |
| Ice Mist | #f5f7fa | --color-ps-ice | Page backgrounds |
| Divider | #f3f3f3 | --color-ps-divider | Section separators |
| Commerce Orange | #d53b00 | --color-ps-orange | No-show buttons, destructive commerce CTAs |
| Warning Red | #c81b3a | --color-ps-red | Form errors, delete confirmations |
| Success | #059669 | emerald-600 | Positive indicators |
| Caution | #d97706 | amber-600 | Warning states |

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

## Edge Runtime Auth Split
Middleware runs in the Edge Runtime, which does not support Node.js `crypto`. The auth config was split into two files:
- `src/auth.config.ts` — edge-safe: providers, session strategy, pages, cookies, `authorized` callback. No DB imports.
- `src/auth.ts` — Node-only: imports `auth.config`, adds `jwt` and `session` callbacks that use `@/lib/db`.
- `middleware.ts` — imports only from `auth.config.ts`.

## Mobile Layout

### Responsive Header
- Title "RVU Tracker" hidden below `sm` (640px); logo "R" circle always visible
- Padding: `px-3` on mobile, `px-6` on `sm`+
- Nav pill padding: `px-2 py-1` on mobile, `px-3 py-1.5` on `sm`+
- UserProfile: avatar circle only on mobile (< `lg`), tapping signs out; full name/email/sign-out on desktop

### Inline Favorites on Mobile
- On mobile (< `lg`), favorites groups and favorites grid render inline on the main page above the selected procedures card
- No bottom sheet or FAB button — everything is visible on one scrollable page
- EntryForm children reorder on mobile via flex `order-` classes:
  1. Favorite Groups (`order-1`)
  2. Favorites grid (`order-2`)
  3. Search / RVUPicker (`order-3`)
- Desktop (`lg`+): search first, then groups, then favorites (order-1, order-2, order-3)

### iOS / SwiftUI Notes (Mobile)
- On iPhone, favorites and groups should be inline on the main Log tab, not behind a modal
- Use a `ScrollView` with groups section, favorites grid, then search bar
- Header: hide title text on compact width, show only logo + nav tabs + avatar

## Edge Cases
- Pages must render identically when navigating between them (no header flash/layout shift).
- Loading skeleton must match the same header width and structure.
- Nav pills must not wrap on mobile (3 items fit within 375px viewport).

## PlayStation Signature Button (ps-btn)
All primary buttons use the `ps-btn` CSS class:
1. At rest: PlayStation Blue (#0070cc) bg, white text, rounded-full (pill)
2. On hover: Cyan (#1eaedb) bg, 2px white border, 2px PlayStation Blue outer ring (box-shadow), scale 1.05×
3. On active: opacity 0.6, scale 1.0
4. Transition: 180ms ease

### Typography Rules
- Display headings (22px+): font-light (weight 300) — not bold
- Body text: font-normal (weight 400)
- UI labels/buttons: font-medium (weight 500)
- No ALL-CAPS labels — sentence case and title case only
- Font: Geist (sans), Geist Mono (mono)

### Border Radius
- Inputs: rounded-lg (8px)
- Cards: rounded-xl (12px)
- Modals: rounded-2xl (16px)
- All buttons: rounded-full (pill shape)

## Acceptance Criteria
- [ ] All 3 pages show identical header: PlayStation Blue "R" circle, "RVU Tracker" title (font-light), 3 nav pills
- [ ] Header background is Console Black (#000000)
- [ ] Active page pill is PlayStation Blue (#0070cc) with white text, rounded-full
- [ ] Inactive pills are white/70 text with cyan hover
- [ ] All pages use max-w-[1400px] container
- [ ] All pages use Ice Mist (#f5f7fa) background
- [ ] Display headings use font-light, not font-bold
- [ ] All buttons are pill-shaped (rounded-full)
- [ ] Primary buttons have ps-btn hover treatment
- [ ] No cyan (#1eaedb) appears at rest — only on hover/focus
- [ ] Focus rings are 2px PlayStation Blue box-shadow
- [ ] `npm run build` passes with no errors

## iOS / SwiftUI Notes
- **Header**: Use a custom `AppHeaderView` with `HStack` containing logo circle (`Circle().fill(Color(hex: "#0070cc"))`), title `Text` with `.fontWeight(.light)`, and `ForEach` over nav items. Active item uses `.background(Color(hex: "#0070cc"))` capsule; inactive uses `.foregroundColor(.white.opacity(0.7))`.
- **Design tokens**: Define as `Color` extensions in a `DesignTokens.swift` file. Map PlayStation Blue to `Color(hex: "#0070cc")`, Cyan to `Color(hex: "#1eaedb")`, Ice Mist to `Color(hex: "#f5f7fa")`, etc.
- **Buttons**: All buttons use `.clipShape(Capsule())` for pill shape. Primary buttons: PlayStation Blue bg, white text. On press: reduce opacity to 0.6.
- **Container width**: Use `.frame(maxWidth: 1400)` with `.padding(.horizontal)` on iPad; full-width on iPhone.
- **Nav**: On iOS, this maps to a `TabView` with 3 tabs (Log, Analytics, Productivity) rather than a top nav bar.
- **Typography**: Display headings use `.fontWeight(.light)`. No bold display text.

## Files (web reference)
- `src/components/AppHeader.tsx` — shared header component + skeleton
- `src/app/(main)/page.tsx` — uses `<AppHeader activePage="log" />`
- `src/app/analytics/page.tsx` — uses `<AppHeader activePage="analytics" />`, blue-500 preset chips
- `src/app/productivity/page.tsx` — uses `<AppHeader activePage="productivity" />`, hex colors
- `docs/templates/home.html` — HTML design reference
- `docs/templates/analytics.html` — HTML design reference
- `docs/templates/productivity.html` — HTML design reference
