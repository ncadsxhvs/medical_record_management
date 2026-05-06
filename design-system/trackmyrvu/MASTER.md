# Design System Master File — PlayStation-Inspired

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** TrackMyRVU
**Updated:** 2026-05-02
**Category:** Healthcare App
**Inspiration:** PlayStation.com — quiet authority, premium surfaces, signature interactions

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Primary (Brand) | `#0070cc` | `--color-ps-blue` | Active nav, primary buttons, links, focus rings |
| Primary hover | `#005fa3` | `--color-ps-blue-hover` | Button pressed states |
| Interaction Cyan | `#1eaedb` | `--color-ps-cyan` | Hover/focus accent ONLY — never at rest |
| Console Black | `#000000` | `--color-ps-black` | Header/nav background |
| Deep Charcoal | `#1f1f1f` | `--color-ps-charcoal` | Body headlines, toast backgrounds |
| Body Gray | `#6b6b6b` | `--color-ps-body-gray` | Secondary text, metadata |
| Mute Gray | `#cccccc` | `--color-ps-mute` | Disabled states, placeholders |
| Paper White | `#ffffff` | `--color-ps-paper` | Card/surface backgrounds |
| Ice Mist | `#f5f7fa` | `--color-ps-ice` | Page backgrounds (replaces stone-50) |
| Divider | `#f3f3f3` | `--color-ps-divider` | Section separators |
| Commerce Orange | `#d53b00` | `--color-ps-orange` | No-show buttons, destructive commerce CTAs |
| Warning Red | `#c81b3a` | `--color-ps-red` | Form errors, delete confirmations |
| Success | `#059669` | emerald-600 | Positive indicators (kept from previous system) |
| Caution | `#d97706` | amber-600 | Warning states (kept from previous system) |

### Typography

- **Font:** Geist (sans-serif), Geist Mono (monospace)
- **Display headings (22px+):** `font-light` (weight 300) — PlayStation quiet authority
- **Body text:** `font-normal` (weight 400)
- **UI labels/captions:** `font-medium` (weight 500)
- **Buttons:** `font-medium` (weight 500)
- **No ALL-CAPS labels** — sentence case and title case only

### Signature Button Hover

Every primary button uses the `ps-btn` class:
1. Background fills to Cyan `#1eaedb`
2. 2px white border appears
3. 2px PlayStation Blue outer ring blooms (`box-shadow: 0 0 0 2px #0070cc`)
4. Button scales `1.05×`
5. Active state: `opacity: 0.6`
6. Transition: 180ms ease

### Border Radius Scale

| Value | Usage |
|-------|-------|
| `rounded-lg` (8px) | Inputs, form controls |
| `rounded-xl` (12px) | Cards, content panels |
| `rounded-2xl` (16px) | Modals, feature cards |
| `rounded-full` (9999px) | All buttons (pill shape) |

### Shadow Scale

| Level | Value | Usage |
|-------|-------|-------|
| Level 0 | None | Default flat content |
| Level 1 | `0 5px 9px rgba(0,0,0,0.06)` | Editorial panels, subtle lift |
| Level 2 | `0 5px 9px rgba(0,0,0,0.08)` | Standard card elevation |
| Level 3 | `0 5px 9px rgba(0,0,0,0.16)` | Emphasized cards, hover |

---

## Layout System

### Page Shell

Every page shares the same shell:

```
bg-[#f5f7fa] min-h-[100dvh]
└── AppHeader (57px, fixed visual height)
└── max-w-[1400px] mx-auto (content container)
```

### 3-Column Layout (Main Page)

Desktop (`lg:` breakpoint, 1024px+):

```
┌─────────────────────────────────────────────────┐
│  AppHeader (Console Black, full width)           │
├──────────┬──────────────────┬───────────────────┤
│  Left    │  Center          │  Right            │
│  flex-1  │  flex-1          │  w-[380px]        │
│  sticky  │  scrollable      │  sticky           │
│  bg-white│  bg-[#f5f7fa]    │  bg-white         │
└──────────┴──────────────────┴───────────────────┘
```

- **Left column**: `lg:flex-1 border-r border-zinc-200/60 bg-white`
- **Center column**: `flex-1 p-5 lg:p-8`
- **Right column**: `lg:w-[380px] border-l border-zinc-200/60 bg-white`
- **Sticky sidebars**: `lg:sticky lg:top-[57px]` with `max-height: calc(100vh - 57px)` and `overflow-y: auto`

Mobile (<1024px): single column, all sections stacked. Left column hidden; its content rendered inline in the center via a separate mobile instance.

### Single-Column Layout (Analytics, Productivity)

```
max-w-[1400px] mx-auto p-5 lg:p-8
└── Content sections stacked vertically
└── Grids within: grid-cols-1 lg:grid-cols-5 gap-6
```

### Centered Layout (Sign-in)

```
min-h-[100dvh] flex items-center justify-center bg-[#f5f7fa]
└── max-w-md w-full
    └── bg-white p-8 rounded-xl shadow-[0_5px_9px_rgba(0,0,0,0.06)]
```

---

## Component Patterns

### Header (AppHeader)

| Property | Value |
|----------|-------|
| Background | Console Black `#000000` |
| Height | 57px (defines sticky offset for all pages) |
| Padding | `px-3 sm:px-6 py-3` |
| Container | `max-w-[1400px] mx-auto` |
| Logo | 32px circle, `bg-[#0070cc]`, white "R" text `text-xs font-bold` |
| App title | `text-lg font-light text-white tracking-tight hidden sm:inline` |
| Active nav pill | `px-3 sm:px-4 py-1 sm:py-1.5 bg-[#0070cc] text-white text-xs font-medium rounded-full` |
| Inactive nav | `text-white/70 hover:text-[#1eaedb] transition-colors` |
| User profile | Right-aligned, shows name + sign-out |

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `bg-[#0070cc] text-white rounded-full font-semibold text-sm ps-btn cursor-pointer active:scale-[0.98] transition-all duration-150` |
| Secondary | `bg-white text-[#1f1f1f] border border-zinc-200 rounded-full text-sm font-medium hover:bg-zinc-50 active:scale-[0.98]` |
| Destructive | `bg-red-50 text-[#d53b00] border border-[#d53b00] rounded-full hover:bg-red-100 active:scale-[0.98]` |
| Ghost (on dark) | `bg-transparent text-white border-2 border-white/30 rounded-full ps-btn` |
| Icon button | `w-8 h-8 rounded-full flex items-center justify-center hover:text-blue-600 transition-colors` |
| Text link | `text-xs font-semibold text-[#0070cc] hover:text-[#1eaedb]` |

**Sizing:**
- Standard: `py-2.5 px-4` (~44px touch target)
- Large: `py-3 px-5`
- Small: `py-1.5 px-3`
- Icon: `p-2` (small), `p-2.5` (medium)
- Dense controls: 36px min (procedure quantity buttons)

**States:**
- Disabled: `disabled:opacity-40 disabled:cursor-not-allowed`
- Loading: text changes to "Exporting..." / "Saving..." etc.
- Active/pressed: `active:scale-[0.98]` (secondary), `opacity: 0.6` (primary via ps-btn)

### Cards

| Variant | Classes | Usage |
|---------|---------|-------|
| Standard | `bg-white rounded-xl border border-zinc-200/80` | Visit cards, KPI cards, content panels |
| Alert (success) | `bg-green-50 border border-green-200 rounded-lg` | Copy indicator, success states |
| Alert (warning) | `bg-amber-50 border border-amber-200 rounded-lg` | Editing warnings |
| Alert (no-show) | `bg-orange-50 border border-orange-200 rounded-xl` | No-show visit cards |
| Selected | `bg-sky-50 border border-sky-200 rounded-lg` | Selected procedures inline |
| KPI card | Standard card + `px-4 py-3`, label `text-[10px] uppercase tracking-wider text-zinc-400`, value `text-2xl font-bold font-mono` |

### VisitCard

**Structure:** Compact row with optional expandable detail.

- **Accent bar**: `w-1 h-8 rounded-full mr-3` — color rotates per date:
  `sky-400 → emerald-400 → amber-400 → rose-400 → violet-400 → teal-400 → orange-300`
- **Collapsed**: time + procedure codes (truncated) + notes + total RVU (`font-mono text-lg font-bold`)
- **Expanded**: bordered procedure list below (`border-t border-zinc-100`, `pl-4 border-l-2 border-zinc-200`)
- **Actions** (edit/copy/delete): `sm:opacity-0 sm:group-hover:opacity-100 transition-opacity` — always visible on mobile, hover-reveal on desktop
- **No-show variant**: `bg-orange-50 border-orange-200`, orange accent bar, "No Show" badge (`bg-orange-500 text-white text-[10px] font-bold rounded-full uppercase`)

### Date Headers (Visit Log)

```
flex items-center justify-between pt-3 pb-1
├── text-xs font-semibold text-zinc-400 uppercase tracking-wider
│   "Today — May 2" or "May 1"
└── text-xs font-mono font-semibold text-[#0070cc]
    "12.34 RVU" (daily total, only if > 0)
```

### ProcedureList

**Layout per row:**

```
bg-zinc-50 rounded-lg px-3 py-2
├── Top row: flex items-start justify-between
│   ├── font-mono font-bold text-sm (HCPCS code)
│   └── × delete button (text-zinc-400 hover:text-red-500)
├── Middle: text-xs text-zinc-500 truncate (description, with title tooltip)
└── Bottom row: flex flex-wrap items-center gap-2
    ├── Qty controls: 36px min buttons (bg-zinc-200 rounded-lg)
    ├── Quantity display: font-mono text-xs
    ├── Unit RVU: text-[11px] text-zinc-400 font-mono
    └── Total: text-sm font-bold text-[#0070cc] font-mono
```

**Minus-to-remove:** At quantity 1, minus button removes the procedure entirely. Aria label changes from "Decrease quantity" to "Remove procedure".

### SelectedProceduresCard

```
bg-white rounded-xl border border-zinc-200
├── Header: procedure count + total RVU (text-3xl font-bold)
├── Procedure rows: ProcedureList component
├── Date/Time/Notes: grid grid-cols-2 gap-3
└── Action buttons: flex gap-2
    ├── No Show (destructive, left)
    ├── Clear (secondary, center) — hidden when no procedures
    └── Save Visit (primary, right, flex-1)
```

### FavoritesPicker

- **Grid**: `grid grid-cols-2 gap-2`
- **Card**: `p-2.5 border rounded-xl bg-white border-zinc-200`
  - Code: `font-mono font-bold text-sm`
  - Description: `text-[11px] text-zinc-400 truncate` (with `title` tooltip for full text)
  - RVU: `text-xs font-mono text-[#0070cc]`
- **Selected state**: `bg-green-50 border-green-300` with green checkmark
- **Hover**: `hover:border-[#0070cc]/30 hover:bg-[#0070cc]/5`
- **Edit mode**: red trash icon overlay (`absolute right-1.5 top-1.5`)
- **Drag-and-drop**: `@dnd-kit`, 8px activation threshold, dragging item: `opacity-40 scale-95 shadow-lg`
- **Add search**: inline search input that appears below header

### DateInput

- Text input with `inputMode="numeric"`, placeholder "MM/DD/YYYY"
- Auto-inserts slashes after month (2 digits) and day (2 digits)
- "Today" button: `absolute right-2 text-xs text-[#0070cc]`
- Blur validates and converts to ISO format

### Toast

| Variant | Classes |
|---------|---------|
| Success | `bg-emerald-900 text-emerald-50` |
| Error | `bg-red-900 text-red-50` |
| Info | `bg-[#1f1f1f] text-zinc-50` |

- Position: `fixed bottom-4 right-4 z-50`
- Layout: `px-4 py-3 rounded-lg text-sm font-medium shadow-lg`
- Animation: `animate-[fadeIn_150ms_ease-out]`
- Duration: 3000ms + (message.length * 80ms); 5000ms with action
- Undo action: `ml-3 text-xs font-semibold underline`
- Accessibility: `role="alert" aria-live="assertive"`

### Skeleton

```
bg-zinc-200 animate-pulse rounded
```

Match the final component's dimensions: `h-8 w-48` for headings, `h-24 rounded-xl` for cards, `h-16 rounded-xl` for list items. Use within the same layout grid as the loaded state.

---

## Modal & Dialog Patterns

### EditVisitModal (Full Modal)

```
fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
└── bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden
    ├── Sticky header: border-b, close button (aria-label="Close")
    ├── Scrollable body: overflow-y-auto max-h-[calc(90vh-140px)]
    └── Sticky footer: border-t, action buttons
```

- Entrance: `animate-fadeIn`
- Dismiss: Escape key, close button
- Focus: managed on open

### ConfirmDialog (Small Dialog)

```
fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
└── bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6
    ├── Title: text-lg font-semibold
    ├── Message: text-sm text-zinc-600
    └── Actions: flex gap-3 justify-end
        ├── Cancel (secondary, auto-focused)
        └── Confirm (primary or danger)
```

- **Danger variant**: confirm button uses `bg-red-600 text-white hover:bg-red-700`
- **Accessibility**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- **Focus trap**: tab wraps between first and last focusable elements
- **Dismiss**: Escape key, click outside overlay

---

## Form Patterns

### Text Input

```
border border-zinc-200 rounded-lg text-sm
focus:outline-none focus:ring-2 focus:ring-[#0070cc]/10 focus:border-[#0070cc]
disabled:opacity-50 disabled:cursor-not-allowed
```

### Search Input

```
w-full pl-9 pr-12 py-2.5 border border-zinc-200 rounded-xl text-sm
bg-zinc-50 focus:bg-white focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/10
```

- Left: search icon (`w-4 h-4 text-zinc-400`)
- Right: keyboard shortcut badge `text-[10px] font-semibold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded` showing `⌘K`
- Dropdown: appears on focus (popular codes) or after 2+ chars (search results, 300ms debounce)

### Custom Code Form

Inline expandable form triggered by "+ Custom Code" text button:

```
p-3 border border-zinc-200 rounded-lg bg-zinc-50 space-y-2
├── Code input: placeholder "Code (e.g. CUSTOM1)"
├── RVU input: placeholder "RVU value", inputMode="decimal"
├── Description input: placeholder "Description"
└── Save button: disabled until code + description filled
```

### Validation

- No inline error messages — validation is implicit via disabled save buttons
- Required fields: save button stays `disabled:opacity-40` until conditions met
- Date validation: incomplete dates silently ignored on blur

---

## UI States

### Empty State

```
bg-zinc-50 rounded-xl border border-zinc-200/80 p-8 text-center
├── SVG icon: w-12 h-12 text-zinc-300 mx-auto mb-3
├── Title: text-sm font-semibold text-zinc-700
└── Subtitle: text-xs text-zinc-400 mt-1
```

### Error State

```
min-h-[100dvh] bg-[#f5f7fa] flex items-center justify-center
└── text-center
    ├── text-red-600 mb-2 (error message)
    └── Primary button (Retry)
```

### Loading State

Skeleton placeholders matching the final layout structure. Use the same grid, same container widths, same approximate heights. See Skeleton component above.

### Hover States

| Element | Hover Treatment |
|---------|----------------|
| Cards/rows | `hover:bg-zinc-100` or `hover:bg-zinc-50` |
| Favorites | `hover:border-[#0070cc]/30 hover:bg-[#0070cc]/5` |
| Action buttons | `hover:text-zinc-700` (from `text-zinc-400`) |
| Delete buttons | `hover:text-red-500` |
| Links | `hover:text-[#1eaedb]` (from `text-[#0070cc]`) |
| Primary buttons | ps-btn signature (cyan fill + ring + scale) |

### Disabled State

```
disabled:opacity-40 disabled:cursor-not-allowed
```

### Drag State

```
opacity-40 scale-95 shadow-lg z-50
```

---

## Accessibility

### Focus Indicators

Global rule in `globals.css`:
```css
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #0070cc;
  border-radius: 6px;
}
```

Form inputs override with: `focus:ring-2 focus:ring-[#0070cc]/10 focus:border-[#0070cc]`

### Touch Targets

- Standard minimum: `min-w-[44px] min-h-[44px]` (Apple HIG)
- Dense controls (procedure quantity): 36px allowed
- All buttons use `cursor-pointer`

### Keyboard

- `Cmd+K` / `Ctrl+K`: focus search input (`[data-search-input]`)
- `Escape`: close modals and dialogs
- `Enter`: confirm date input on blur
- Tab order: default DOM order, trapped in modals

### ARIA

- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- Toasts: `role="alert"`, `aria-live="assertive"`
- Icon-only buttons: `aria-label` describing the action (e.g., "Remove 99213", "Close")
- Quantity buttons: `aria-label` changes based on state ("Decrease quantity" vs "Remove procedure")

### Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Patterns

### Breakpoints

| Token | Width | Behavior |
|-------|-------|----------|
| (default) | < 640px | Mobile: single column, full-width components |
| `sm:` | 640px | Spacing increases, nav text appears |
| `lg:` | 1024px | 3-column layout activates, sidebars appear |

### Common Responsive Techniques

| Pattern | Implementation |
|---------|---------------|
| Column show/hide | `hidden lg:block` (desktop only), `lg:hidden` (mobile only) |
| Order swap | `order-3 lg:order-1` (search moves to top on desktop) |
| Spacing scale | `p-5 lg:p-8`, `gap-1.5 sm:gap-3` |
| Action visibility | `sm:opacity-0 sm:group-hover:opacity-100 transition-opacity` |
| Grid columns | `grid-cols-2 lg:grid-cols-4` (KPI), `grid-cols-1 lg:grid-cols-3` (scores) |
| Typography | `text-2xl lg:text-5xl` (editorial headlines) |
| Sticky columns | `lg:sticky lg:top-[57px]` + `max-height: calc(100vh - 57px)` |

### Mobile Considerations

- Left/right columns render as `hidden lg:block`; mobile-specific duplicates rendered inline with `lg:hidden`
- Form section order changes via Tailwind `order-` classes (favorites first on mobile, search first on desktop)
- Action buttons on visit cards: always visible on mobile, hover-reveal on desktop
- Full-width modals on mobile (`mx-4` gives minimal margin)

---

## Animation & Transition

| Name | Value | Usage |
|------|-------|-------|
| Standard | `transition-all duration-150` | General state changes |
| ps-btn | `transition: all 180ms ease` | Primary button hover signature |
| Button press | `active:scale-[0.98]` | Tactile feedback on click |
| Modal entrance | `animate-fadeIn` | Modal/dialog appearance |
| Toast entrance | `animate-[fadeIn_150ms_ease-out]` | Toast notification appearance |
| Visibility | `transition-opacity` | Hover-reveal action buttons |
| Color | `transition-colors` | Link and nav hover states |

### Keyframes (defined in globals.css)

```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

`fadeIn` is used via Tailwind arbitrary animation syntax.

---

## Icon System

### Approach

Inline SVG — no icon library. Icons follow Heroicons outline style.

### SVG Attributes

```tsx
fill="none" stroke="currentColor" strokeWidth={2}
strokeLinecap="round" strokeLinejoin="round"
viewBox="0 0 24 24"
```

### Sizes

| Size | Classes | Usage |
|------|---------|-------|
| Small | `w-3 h-3`, `w-3.5 h-3.5` | Inline text indicators |
| Standard | `w-4 h-4` | Buttons, form icons, nav |
| Medium | `w-5 h-5` | Section headers |
| Large | `w-12 h-12` | Empty state illustrations |

### Colors

- Default: `text-zinc-400`
- Hover: `hover:text-zinc-700`
- Accent: `text-[#0070cc]`
- Danger: `text-red-400` / `hover:text-red-500`
- Favorites star: `★` (filled, `text-yellow-500`) / `☆` (empty) — character, not SVG

---

## Page Layouts

### Main — Log Visit (`src/app/(main)/page.tsx`)

3-column layout (see Layout System above).

- **Left**: `EntryForm` (search + favorite groups + favorites)
- **Center**: editorial headline "Log Visit", `SelectedProceduresCard`
- **Right**: "Visit Log" header with today count, visit feed grouped by date with daily RVU totals

### Analytics (`src/app/analytics/page.tsx`)

Single-column centered.

- Editorial headline (dynamic: "On Pace" green or "Behind" amber)
- Period preset chips: `px-3.5 py-1.5 text-xs font-semibold rounded-full border` — active: `bg-[#0070cc] text-white`, inactive: `bg-white text-zinc-700 border-zinc-200`
- Export button: secondary pill inline with chips
- Summary grid: `grid grid-cols-1 lg:grid-cols-5 gap-6`
  - SummaryStats (full width)
  - RVUChart (`lg:col-span-3`)
  - TopCodes (`lg:col-span-2`)
  - BonusProjection (full width)

### Productivity (`src/app/productivity/page.tsx`)

Single-column centered.

- Score rings: `grid grid-cols-1 lg:grid-cols-3 gap-8`, separated by `lg:border-r border-zinc-200/80`
- Rhythm + Streak: `grid grid-cols-1 lg:grid-cols-5 gap-6` (3+2 split)
- Trend + Peers: same 5-col pattern
- Coaching + Reminder: full width sections

### Sign-in (`src/app/sign-in/page.tsx`)

Centered card layout (see Layout System above). Google OAuth button as primary CTA.

---

## Anti-Patterns (Do NOT Use)

- No gradient buttons or text
- No ALL-CAPS labels or kickers
- No bold display headlines (use font-light at 22px+)
- No emojis as icons — use SVG (Heroicons style)
- No cyan `#1eaedb` at rest — only on hover/focus
- No warm colors outside Commerce Orange
- No square corners on buttons (always pill)
- No shadows between 0.08 and 0.8 opacity — whisper or shout, never mutter
- No inline error messages — use disabled states for validation
- No global state management — all state is local (useState)
- No `new Date(string)` — use `parseLocalDate()` from `@/lib/dateUtils`

---

## Pre-Delivery Checklist

- [ ] Display headings (22px+) use font-light, not font-bold
- [ ] All buttons are pill-shaped (rounded-full)
- [ ] Primary buttons have ps-btn hover treatment
- [ ] Header is Console Black with white text
- [ ] Page backgrounds are Ice Mist `#f5f7fa`
- [ ] No cyan appears at rest — only on hover/focus
- [ ] Focus rings are 2px PlayStation Blue
- [ ] No emojis as icons
- [ ] `cursor-pointer` on all clickable elements
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Touch targets >= 44px (36px only for dense controls)
- [ ] Modals have focus trap, Escape dismiss, ARIA attributes
- [ ] Icon-only buttons have `aria-label`
- [ ] Empty states follow the standard pattern (icon + title + subtitle)
- [ ] Skeleton loading matches final layout dimensions
- [ ] Dates use `parseLocalDate()`, never `new Date(string)`
