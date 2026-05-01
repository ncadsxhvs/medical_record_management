# Design System Master File — PlayStation-Inspired

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** TrackMyRVU
**Updated:** 2026-04-30
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

## Component Patterns

### Header (AppHeader)
- Background: Console Black `#000000`
- Logo: 32px circle, PlayStation Blue fill, white "R"
- Title: `font-light text-white`
- Active nav pill: `bg-[#0070cc] text-white rounded-full`
- Inactive nav: `text-white/70 hover:text-[#1eaedb]`

### Buttons
- Primary: `bg-[#0070cc] text-white rounded-full ps-btn`
- Secondary: `bg-white border border-zinc-200 text-[#1f1f1f] rounded-full`
- Destructive: `text-[#d53b00] border border-[#d53b00] rounded-full`
- Ghost (on dark): `bg-transparent border-2 border-white/30 text-white rounded-full ps-btn`

### Cards
- `bg-white rounded-xl shadow-[0_5px_9px_rgba(0,0,0,0.06)]`

### Inputs
- `border border-zinc-200 rounded-lg focus:border-[#0070cc] focus:ring-[#0070cc]/10`

### Focus States
- `box-shadow: 0 0 0 2px #0070cc` (2px PlayStation Blue ring)

### Container
- Max width: `max-w-[1400px] mx-auto`

---

## Anti-Patterns (Do NOT Use)

- No gradient buttons or text
- No ALL-CAPS labels or kickers
- No bold display headlines (use font-light at 22px+)
- No emojis as icons — use SVG (Heroicons, Lucide)
- No cyan `#1eaedb` at rest — only on hover/focus
- No warm colors outside Commerce Orange
- No square corners on buttons (always pill)
- No shadows between 0.08 and 0.8 opacity — whisper or shout, never mutter

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
