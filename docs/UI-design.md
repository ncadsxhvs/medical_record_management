# UI Design Reference — TrackMyRVU

> Living document describing every visual element in the current UI.
> Source of truth: `design-system/trackmyrvu/MASTER.md` (PlayStation-inspired system).

---

## Color System

### Brand & Interaction

| Role | Value | Variable | Usage |
|------|-------|----------|-------|
| PlayStation Blue | `#0070cc` | `--color-ps-blue` | Primary buttons, active nav, focus rings, links, today indicator |
| Blue Hover | `#005fa3` | `--color-ps-blue-hover` | Button pressed/hover states |
| Interaction Cyan | `#1eaedb` | `--color-ps-cyan` | Hover/focus accent ONLY — never at rest |

### Surfaces & Neutrals

| Role | Value | Variable | Usage |
|------|-------|----------|-------|
| Console Black | `#000000` | `--color-ps-black` | Header background |
| Deep Charcoal | `#1f1f1f` | `--color-ps-charcoal` | Display headings, info toast bg |
| Body Gray | `#6b6b6b` | `--color-ps-body-gray` | Secondary text, metadata, chart legends |
| Mute Gray | `#cccccc` | `--color-ps-mute` | Disabled states, placeholders, target lines |
| Paper White | `#ffffff` | `--color-ps-paper` | Cards, modals, inputs |
| Ice Mist | `#f5f7fa` | `--color-ps-ice` | Page backgrounds |
| Divider | `#f3f3f3` | `--color-ps-divider` | Section separators |

### Semantic

| Role | Value | Tailwind | Usage |
|------|-------|----------|-------|
| Success Green | `#059669` | `emerald-600` | Positive metrics, logged RVU bars, hit targets, streak indicators |
| Caution Amber | `#d97706` | `amber-600` | Warning states, slow-pace indicators |
| Commerce Orange | `#d53b00` | `--color-ps-orange` | No-show buttons, destructive commerce CTAs |
| Warning Red | `#c81b3a` | `--color-ps-red` | Form errors, delete confirmations |

### Data Visualization

| Role | Value | Where Used |
|------|-------|------------|
| Logged bars | `emerald-600` | Daily RVU chart — logged days |
| Today bar | `#0070cc` | Daily RVU chart — today highlight |
| Progress (today) | `green-600` | KPI strip — today RVU progress |
| Progress (weekly) | `#3b82f6` | KPI strip — weekly & MTD progress, encounters sparkline |
| Productivity green | `oklch(60% 0.13 155)` | TodayRhythm high bars, WeeklyTrend above-target, StreakGrid hit, CoachingSuggestions peak dot |
| Current/personal purple | `oklch(55% 0.15 265)` | WeeklyTrend current week, PeerComparison "you" bar, StreakGrid today, CoachingSuggestions end-of-day dot |
| Positive sparkline | `#16a34a` | SummaryStats positive trend |
| Negative/neutral sparkline | `#a1a1aa` | SummaryStats negative trend, PeerComparison peer bar |
| Coaching yellow | `oklch(72% 0.13 75)` | CoachingSuggestions G2211 dot |

### Gradient Cards (BonusProjection)

| Card | From | To | Border |
|------|------|----|--------|
| Actual RVU | `#0070cc/5` | `#0070cc/10` | `#0070cc/20` |
| Annualized | `indigo-50` | `indigo-100` | `indigo-200` |
| Surplus | `emerald-50` | `emerald-100` | `emerald-200` |
| Annual Bonus | `amber-50` | `amber-100` | `amber-200` |
| Period Bonus | `purple-50` | `purple-100` | `purple-200` |

---

## Typography

| Context | Size | Weight | Font | Color |
|---------|------|--------|------|-------|
| Display headings (22px+) | 24-30px | `font-light` (300) | Geist | `#1f1f1f` |
| Section titles | 18-20px | `font-semibold` (600) | Geist | `zinc-900` |
| Body text | 14px | `font-normal` (400) | Geist | `zinc-700` |
| UI labels / buttons | 14px | `font-medium` (500) | Geist | varies |
| Metadata / captions | 12px | `font-normal` (400) | Geist | `zinc-500` |
| KPI labels | 10px | `font-semibold`, uppercase | Geist | `zinc-400` |
| KPI values | 24-30px | `font-bold` (700) | Geist Mono | `zinc-900` |
| Monospace data | varies | varies | Geist Mono | varies |
| Chart axis labels | 11px | `font-normal` | Geist Mono | `zinc-400` |

**Rules:**
- No ALL-CAPS labels in UI copy — only in tiny KPI labels (10px)
- Sentence case and title case only
- No bold on display headings — always `font-light`

---

## Spacing & Layout

### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Grid gaps, tight spacing |
| 1.5 | 6px | Chart bar gaps |
| 2 | 8px | Inner padding, icon gaps |
| 3 | 12px | Card padding (compact), component gaps |
| 4 | 16px | Standard card padding, section gaps |
| 5 | 20px | Section spacing |
| 6 | 24px | Card padding (generous), chart containers |
| 8 | 32px | Large section spacing |

### Container

- Max width: `max-w-[1400px]` centered with `mx-auto`
- Page padding: `px-3` mobile, `px-6` desktop

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Default | 0-639px | Single column, compact nav |
| `sm` | 640px | Show title, wider padding |
| `md` | 768px | 2-column grids |
| `lg` | 1024px | 3-column layout, show desktop elements |
| `xl` | 1280px | Wider analytics grids |

---

## Border Radius

| Value | Tailwind | Usage |
|-------|----------|-------|
| 4px | `rounded` | Skeleton, small indicators, chart cells |
| 8px | `rounded-lg` | Inputs, form controls, toast, suggestion cards |
| 12px | `rounded-xl` | Standard cards, KPI cards, visit cards, chart containers |
| 16px | `rounded-2xl` | Modals, feature cards, summary stats, chart wrapper |
| 9999px | `rounded-full` | ALL buttons (pill shape), nav pills, avatar, logo |

---

## Shadow Scale

| Level | Value | Usage |
|-------|-------|-------|
| 0 | None | Default flat content, most cards |
| 1 | `0 5px 9px rgba(0,0,0,0.06)` | Editorial panels, sign-in card |
| 2 | `0 5px 9px rgba(0,0,0,0.08)` | Standard card elevation |
| Border-only | `border border-zinc-200/80` | Most cards use border instead of shadow |
| `shadow-md` | Tailwind default | BonusProjection card |
| `shadow-lg` | Tailwind default | Toast notifications |

---

## Components

### AppHeader

| Element | Style |
|---------|-------|
| Background | Console Black `#000000` |
| Logo | 32px circle, `bg-[#0070cc]`, white "R", bold |
| Title | 18px, `font-light`, white, hidden below `sm` |
| Active nav pill | `bg-[#0070cc]`, white text, `rounded-full` |
| Inactive nav pill | `text-white/70`, `hover:text-[#1eaedb]`, `rounded-full` |
| Container | `max-w-[1400px]`, `px-3 sm:px-6`, `py-3` |
| Mobile | Hide title, shrink pill padding to `px-3 py-1` |

### UserProfile

| Viewport | Style |
|----------|-------|
| Mobile (< lg) | 32px avatar circle, `bg-white/20`, white initial, `hover:bg-[#1eaedb]`, tapping signs out |
| Desktop (lg+) | Name + email text (white), ghost Sign Out button with `ps-btn` class, `border-2 border-white/30` |

### Buttons

| Variant | Style |
|---------|-------|
| Primary | `bg-[#0070cc] text-white rounded-full ps-btn` |
| Secondary | `bg-white border border-zinc-200 text-[#1f1f1f] rounded-full` |
| Ghost (dark bg) | `bg-transparent border-2 border-white/30 text-white rounded-full ps-btn` |
| Destructive | `text-[#d53b00] border border-[#d53b00] rounded-full` |
| Cancel | `bg-zinc-100 text-zinc-700 rounded-full hover:bg-zinc-200` |
| Danger confirm | `bg-red-600 text-white rounded-full hover:bg-red-700` |

**ps-btn hover signature:**
1. Background fills to Cyan `#1eaedb`
2. 2px white border appears
3. 2px PlayStation Blue outer ring (`box-shadow: 0 0 0 2px #0070cc`)
4. Scale `1.05x`
5. Active: `opacity: 0.6`, scale `1.0`
6. Transition: 180ms ease

### Inputs

| Style | Value |
|-------|-------|
| Border | `border border-zinc-200` or `border-zinc-300` |
| Radius | `rounded-lg` (8px) |
| Focus | `border-[#0070cc] ring-[#0070cc]/10` or `ring-2 ring-[#0070cc]` |
| Padding | `px-3 py-2` or `px-4 py-2` |

### Cards

| Style | Value |
|-------|-------|
| Background | `bg-white` |
| Border | `border border-zinc-200/80` |
| Radius | `rounded-xl` (12px) standard, `rounded-2xl` (16px) for feature/summary cards |
| Padding | `p-4` compact, `p-5` standard, `p-6` generous |

### Toast

| Variant | Background | Text |
|---------|------------|------|
| Success | `bg-emerald-900` | `text-emerald-50` |
| Error | `bg-red-900` | `text-red-50` |
| Info | `bg-[#1f1f1f]` | `text-zinc-50` |

Position: `fixed bottom-4 right-4 z-50`, `rounded-lg`, `shadow-lg`
Auto-dismiss: 3-5 seconds

### ConfirmDialog

| Element | Style |
|---------|-------|
| Overlay | `bg-black/40 backdrop-blur-sm` |
| Modal | `bg-white rounded-xl p-6 max-w-sm` |
| Title | 18px, semibold |
| Message | 14px, `text-zinc-600` |
| Cancel | `bg-zinc-100 rounded-full` |
| Confirm (default) | `bg-[#0070cc] rounded-full` |
| Confirm (danger) | `bg-red-600 rounded-full` |

### EditVisitModal

| Element | Style |
|---------|-------|
| Modal | `bg-white rounded-2xl max-w-4xl max-h-[90vh]` |
| Selected section | `bg-[#0070cc]/5 border-[#0070cc]/20 rounded-xl` |
| Save button | `bg-[#0070cc] rounded-full`, disabled: `bg-zinc-300` |

### KPIStrip

| Element | Style |
|---------|-------|
| Layout | 2x2 grid mobile, 4-column desktop |
| Card | `bg-white rounded-xl border-zinc-200/80 px-4 py-3` |
| Accent bar | 4px wide, 32px tall, left side |
| Labels | 10px, semibold, uppercase, `text-zinc-400` |
| Values | 24px, bold, monospace, `text-zinc-900` |
| Progress (today) | `green-600` fill |
| Progress (weekly/MTD) | `#3b82f6` fill |
| Sparkline | `#3b82f6` stroke |

### VisitCard

| Element | Style |
|---------|-------|
| Normal | `bg-white rounded-xl border-zinc-200/80` |
| No-show | `bg-orange-50 border-orange-200` |
| No-show badge | `bg-orange-500 text-white` |
| Accent bar | 4px wide, 32px tall, customizable color |
| RVU total | 18px, monospace, bold |
| Delete button | `text-red-400 hover:text-red-600` |

### EntryForm

| Element | Style |
|---------|-------|
| Save Visit | `bg-[#0070cc] rounded-full ps-btn` |
| No Show | `text-[#d53b00] border-[#d53b00] rounded-full` |
| Selected procedures | `bg-sky-50 border-sky-200 rounded-xl` |
| Copy banner | `bg-green-50 border-green-200` |
| Edit warning | `bg-amber-50 border-amber-200` |
| Mobile order | Groups (1), Favorites (2), Search (3) |
| Desktop order | Search (1), Groups (2), Favorites (3) |

### FavoritesPicker

| Element | Style |
|---------|-------|
| Selected favorite | `bg-emerald-600 text-white` (green highlight) |
| Hover | `border-[#0070cc]/30 bg-[#0070cc]/5` |
| Action buttons | `rounded-full cursor-pointer` |

### FavoriteGroupsPicker

| Element | Style |
|---------|-------|
| Management card | `bg-[#0070cc]/5 border-[#0070cc]/30` |
| Editor | `border-[#0070cc]/20 bg-[#0070cc]/5` |
| Save/Create | `bg-[#0070cc] rounded-full` |
| Group dots | `blue-500, green-500, amber-500, rose-500, violet-500, teal-500` |

### RVUPicker

| Element | Style |
|---------|-------|
| Search focus | `border-[#0070cc] ring-[#0070cc]/10` |
| Add Selected | `bg-[#0070cc] rounded-full` |
| Favorite star | `text-yellow-500` |

---

## Charts & Data Visualization

### Daily RVU Bar Chart (RVUChart)

| Element | Style |
|---------|-------|
| Card | `bg-white rounded-2xl border-zinc-200/80 p-6` |
| Title | 24px, `font-light`, `text-[#1f1f1f]` |
| Logged bars | `bg-emerald-600`, hover `bg-emerald-500` |
| Today bar | `bg-[#0070cc]`, hover `bg-[#005fa3]` |
| Off-day | Diagonal stripe pattern (`#e4e4e7`) |
| Target line | Dashed `border-[#cccccc]` |
| Y-axis | 12px monospace, `text-zinc-400` |
| X-axis (today) | 11px monospace, `text-[#0070cc]`, bold |
| X-axis (other) | 11px monospace, `text-zinc-400` |
| Chart height | 260px |
| Legend | Logged (emerald), Today (blue), Target (dashed), Off day (striped) |

### Summary Stats (SummaryStats)

| Element | Style |
|---------|-------|
| Card | `bg-white rounded-2xl border-zinc-200/80 p-5` |
| Layout | 1-col mobile, 2-col tablet, 4-col desktop |
| Labels | 10px, semibold, uppercase, `text-zinc-500` |
| Values | 30px, monospace, bold, `text-zinc-900` |
| Positive change | `text-green-600` with sparkline `#16a34a` |
| Negative change | `text-red-500` with sparkline `#a1a1aa` |

### Bonus Projection (BonusProjection)

| Element | Style |
|---------|-------|
| Card | `bg-white rounded-2xl shadow-md` |
| Expandable | Chevron rotates, `hover:bg-zinc-50` |
| Progress bar | `bg-zinc-200` track, `bg-[#0070cc]` fill (emerald-500 at 100%) |
| Result cards | Gradient backgrounds with matching borders (see Gradient Cards table) |

### Breakdown Table (BreakdownTable)

| Element | Style |
|---------|-------|
| Header row | `bg-zinc-100`, 12px, semibold, uppercase |
| Period header | `bg-[#0070cc]/5`, `border-t-2 border-[#0070cc]/20` |
| Row hover | `hover:bg-[#0070cc]/5` |
| Alternating rows | white / `bg-zinc-50` |

### Today Rhythm (TodayRhythm)

| Element | Style |
|---------|-------|
| High productivity bar | `oklch(60% 0.13 155)` (teal/green) |
| Low productivity bar | `#18181b` (near black) |
| Future hour opacity | `0.4` |
| Chart height | 160px |

### Weekly Trend (WeeklyTrend)

| Element | Style |
|---------|-------|
| Above-target bar | `oklch(60% 0.13 155)` (teal/green) |
| Below-target bar | `#18181b` (near black) |
| Current week bar | `oklch(55% 0.15 265)` (purple) |
| Target line | Dashed `border-zinc-300` |
| Chart height | 140px |

### Streak Grid (StreakGrid)

| Element | Style |
|---------|-------|
| Hit target cell | `oklch(60% 0.13 155)`, opacity 0.85 |
| Today (hit) cell | `oklch(55% 0.15 265)`, opacity 1.0, 2px border |
| Missed cell | `#e4e4e7`, opacity 0.6 |
| Streak number | 48px, monospace, bold, `oklch(60% 0.13 155)` |

### Peer Comparison (PeerComparison)

| Element | Style |
|---------|-------|
| Your bar | `oklch(55% 0.15 265)` (purple) |
| Peer bar | `#a1a1aa`, opacity 0.5 |
| Bar height | 6px (you), 10px (peer) |

### Coaching Suggestions (CoachingSuggestions)

| Element | Style |
|---------|-------|
| Container | `bg-zinc-50 rounded-xl border-zinc-200/80 p-6` |
| Cards | `bg-white rounded-lg border-zinc-200/80 p-4` |
| Peak day dot | `oklch(60% 0.13 155)` |
| G2211 dot | `oklch(72% 0.13 75)` |
| End-of-day dot | `oklch(55% 0.15 265)` |

---

## Interactive States

### Focus
- All interactive elements: `box-shadow: 0 0 0 2px #0070cc` (no outline)
- Inputs: `border-[#0070cc] ring-[#0070cc]/10`

### Hover
- Primary buttons: ps-btn signature (cyan + border + ring + scale)
- Cards/rows: subtle background shift
- Links: `text-[#0070cc]` or `hover:underline`
- Nav items: `text-[#1eaedb]` (cyan)

### Active/Pressed
- Buttons: `active:scale-[0.98]` or `opacity: 0.6`
- Cards: click to expand/select

### Disabled
- Buttons: `bg-zinc-300 cursor-not-allowed`
- Inputs: `bg-zinc-50 text-zinc-400`

### Loading
- Skeleton: `bg-zinc-200 animate-pulse rounded`
- Buttons: disabled with spinner during async

---

## Page Layouts

### Log Page (`/`)

```
[AppHeader — Console Black, full width]
[Ice Mist background]
  [max-w-[1400px] centered]
    Desktop: 3-column (EntryForm | SelectedProcedures | VisitFeed)
    Mobile:  1-column (Groups → Favorites → Search → Selected → Feed)
  [KPIStrip — 4 metric cards]
```

### Analytics Page (`/analytics`)

```
[AppHeader]
[Ice Mist background]
  [max-w-[1400px] centered]
    [Period preset pills — active: bg-[#0070cc] rounded-full]
    [SummaryStats — 4 metric cards]
    [RVUChart — Daily bars]
    [BonusProjection — expandable]
    [BreakdownTable — grouped by period]
```

### Productivity Page (`/productivity`)

```
[AppHeader]
[Ice Mist background]
  [max-w-[1400px] centered]
    [Headline — font-light, pace color: emerald/amber]
    [Score rings — emerald-600/#0070cc]
    [TodayRhythm | WeeklyTrend — 2-column]
    [StreakGrid | PeerComparison — 2-column]
    [CoachingSuggestions — 3-column]
```

### Sign-in Page (`/sign-in`)

```
[Ice Mist background, centered]
  [Title — 30px, font-light, #1f1f1f]
  [Subtitle — #6b6b6b]
  [White card — rounded-xl, shadow level 1]
    [Google button — rounded-full, border-zinc-200]
    [Dev button — rounded-full, amber-50]
```

---

## Anti-Patterns (Do NOT Use)

- No gradient buttons or text
- No ALL-CAPS labels (except tiny 10px KPI labels)
- No bold display headings — use `font-light` at 22px+
- No emojis as icons — use SVG (Heroicons, Lucide)
- No Cyan `#1eaedb` at rest — only on hover/focus
- No warm colors outside Commerce Orange
- No square corners on buttons — always pill (`rounded-full`)
- No shadows between 0.08 and 0.8 opacity

---

## Pre-Delivery Checklist

- [ ] Display headings (22px+) use `font-light`, not `font-bold`
- [ ] All buttons are pill-shaped (`rounded-full`)
- [ ] Primary buttons have ps-btn hover treatment
- [ ] Header is Console Black with white text
- [ ] Page backgrounds are Ice Mist `#f5f7fa`
- [ ] No cyan appears at rest — only on hover/focus
- [ ] Focus rings are 2px PlayStation Blue
- [ ] No emojis as icons
- [ ] `cursor-pointer` on all clickable elements
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Chart bars use emerald-600 (logged) and #0070cc (today)
- [ ] Semantic colors consistent: emerald = success, amber = caution, orange = no-show, red = error
