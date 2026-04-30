# UX Improvements — Accessibility, Touch Targets, Mobile Layout

## Status
- **Branch:** feat/addbutton-for-fav
- **Shipped:** 2026-04-29
- **Related:** FEATURE_LOG Entry 23

## Purpose
Bring the app to WCAG AA accessibility standards, ensure all interactive elements meet 44px touch target minimums, add mobile-optimized layout with FAB + bottom sheet, unify the color system, and add power-user features (undo, keyboard shortcuts).

## User Flow

### Accessibility
1. User navigates with keyboard — every interactive element shows a 3px sky-500 focus ring.
2. User with screen reader encounters modals — announced as `role="dialog"` with title via `aria-labelledby`.
3. User with screen reader encounters toasts — announced via `role="alert"` with `aria-live="assertive"`.
4. User presses Escape in any modal — modal closes.
5. User tabs in ConfirmDialog — focus cycles between Cancel and Confirm buttons (focus trap).
6. User with `prefers-reduced-motion` — all animations and transitions disabled.
7. User presses Tab from page load — skip-to-content link appears, jumps to main content area.

### Mobile Layout
1. On screens < 1024px (lg breakpoint), the entry form sidebar is hidden.
2. A floating action button (FAB) appears at bottom-right: 56px circle, dark background, plus icon.
3. User taps FAB — a bottom sheet slides up (max 85vh) containing the entry form.
4. User can dismiss by tapping backdrop, tapping close button, or submitting a visit.
5. On desktop (>= 1024px), the sidebar renders as a sticky panel — FAB is hidden.

### Undo Delete
1. User confirms visit deletion via ConfirmDialog.
2. Visit is removed from the list immediately (optimistic).
3. Toast appears: "Visit deleted" with an "Undo" button, visible for 5 seconds.
4. If user clicks "Undo" — deletion is cancelled, visit reappears (re-fetched from server).
5. If 5 seconds elapse without undo — DELETE API call fires.

### Keyboard Shortcuts
1. `Cmd+K` (or `Ctrl+K`) — focuses the HCPCS search input.
2. `Cmd+N` (or `Ctrl+N`) — opens the mobile bottom sheet (or focuses search on desktop).
3. Shortcuts are disabled when an input, textarea, or select is focused.

## UI Specification

### Focus Ring (global)
- Style: 3px solid outline, sky-500 color, 2px offset, 6px border-radius
- Applied to: all elements via `:focus-visible` pseudo-class
- Removed for: mouse clicks (`:focus-visible` handles this natively)

### Touch Targets
- Minimum size: 44x44px on all interactive buttons
- Implementation: `min-w-[44px] min-h-[44px]` with flex centering
- Icon size remains small (16px); padding expands the tap area
- Applies to: VisitCard action buttons, ProcedureList quantity +/- buttons, ProcedureList favorite/remove buttons, EntryForm inline quantity buttons

### Mobile Action Visibility
- On screens < 640px (sm breakpoint): VisitCard action buttons are always visible
- On screens >= 640px: action buttons appear on hover (`sm:opacity-0 sm:group-hover:opacity-100`)

### FAB (Floating Action Button)
- Position: fixed, bottom 24px, right 16px
- Size: 56x56px circle
- Color: zinc-900 background, white icon
- Icon: plus sign, 24px, stroke-width 2.5
- Z-index: 30
- Visibility: hidden on lg+ screens (`lg:hidden`)

### Bottom Sheet
- Background overlay: black/40 with backdrop-blur-sm
- Sheet: white, rounded-t-2xl, max-height 85vh, overflow-auto
- Handle bar: 40x4px zinc-300 rounded pill at top
- Animation: slideUp 300ms ease-out
- Close button: 44px touch target with X icon
- Z-index: 40 (overlay) + 50 (sheet)

### Toast with Action
- Layout: flex row, message + optional action button
- Action button: text-xs, font-semibold, underlined, inline after message
- Duration: 5000ms when action present, otherwise max(3000, message.length * 80)ms
- ARIA: `role="alert"`, `aria-live="assertive"`

### Skeleton Loading
- Component: div with `animate-pulse bg-zinc-200 rounded` + custom className for sizing
- Loading screen layout: skeleton header bar + skeleton sidebar (desktop only) + skeleton KPI cards + skeleton visit rows
- Route-level loading.tsx: three staggered bars (full, 75%, 50% width)

### Empty State
- Container: white card with border, shadow-sm, centered
- Icon: clipboard with checkmark SVG, 48px, zinc-300
- Heading: "No visits yet today" (text-sm, font-semibold, zinc-700)
- Subtext: "Search for HCPCS codes or use your favorites to log your first visit." (text-xs, zinc-400)

### Color System
- All components use `zinc-*` scale exclusively (no `gray-*`)
- Semantic mapping: zinc-900 (text primary), zinc-700 (text secondary), zinc-500 (text muted), zinc-400 (text disabled), zinc-300 (borders light), zinc-200 (backgrounds), zinc-100 (hover backgrounds), zinc-50 (subtle backgrounds)

## Data Model
No data model changes. All changes are UI-only.

## Persistence
No new persistence. Keyboard shortcuts are hardcoded.

## API Contracts
No new API endpoints. The delete undo pattern delays the existing `DELETE /api/visits/:id` call by 5 seconds.

## Business Logic

### Toast Timeout Scaling
```
duration = action ? 5000 : max(3000, message.length * 80)
```

### Undo Delete Flow
```
1. Remove visit from local cache (optimistic)
2. Set 5s timer to call DELETE API
3. Show toast with "Undo" action
4. If "Undo" clicked:
   a. Clear timer (API never called)
   b. Re-fetch visits from server (restores deleted visit)
5. If timer fires: call DELETE, then re-fetch
```

## Edge Cases
- **Double-click delete**: Prevented by removing visit from local state immediately; second click finds nothing.
- **Undo after navigation**: Timer fires in background; if user navigated away, the API call still executes.
- **Escape key in nested modals**: Only the topmost modal's Escape handler fires (event listener order).
- **Keyboard shortcuts in inputs**: Shortcuts are suppressed when focus is in input/textarea/select elements.
- **Reduced motion + slideUp**: The `prefers-reduced-motion` media query sets `animation-duration: 0.01ms`, effectively skipping the slide animation.

## Acceptance Criteria
- [ ] Tab through entire page — every button/link/input shows visible focus ring
- [ ] Open ConfirmDialog — Tab cycles only between Cancel and Confirm; Escape closes
- [ ] Open EditVisitModal — Escape closes; close button has accessible name
- [ ] Screen reader announces toasts as alerts
- [ ] All icon buttons pass axe accessibility audit (have accessible names)
- [ ] All buttons measure >= 44x44px touch area in DevTools
- [ ] On 375px viewport: FAB visible, sidebar hidden, action buttons visible without hover
- [ ] Tap FAB — bottom sheet slides up with entry form; dismiss via X, backdrop, or submit
- [ ] On 1024px+ viewport: sidebar visible, FAB hidden
- [ ] No `gray-*` Tailwind classes remain in `src/` (run `grep -r "gray-" src/`)
- [ ] Loading state shows skeleton layout, not "Loading..." text
- [ ] Empty visit list shows clipboard icon + descriptive message
- [ ] Delete visit — toast shows "Undo" button; clicking it restores the visit
- [ ] Wait 5s without undo — visit is permanently deleted
- [ ] Cmd+K focuses search input; Cmd+N opens mobile form / focuses search
- [ ] `prefers-reduced-motion: reduce` disables all animations

## iOS / SwiftUI Notes
- **Focus ring**: Use `.focusable()` modifier with custom `FocusState` styling; SF Symbols for icons.
- **Touch targets**: SwiftUI buttons default to 44pt; ensure `.frame(minWidth: 44, minHeight: 44)` on custom controls.
- **Bottom sheet**: Use `.sheet(isPresented:)` with `presentationDetents([.large])` or custom height.
- **FAB**: Overlay a `Circle()` button at `.position(x:y:)` in a `ZStack`. Hide on iPad with `horizontalSizeClass`.
- **Toast**: Use a custom overlay view with `withAnimation` and `DispatchWorkItem` for timed dismiss. Add "Undo" as a `Button` inside the toast HStack.
- **Undo pattern**: Use `DispatchWorkItem` with 5s delay; cancel on undo tap; call API on fire.
- **Skeleton**: Use `RoundedRectangle` with `.redacted(reason: .placeholder)` or custom shimmer effect.
- **Keyboard shortcuts**: Use `.keyboardShortcut("k", modifiers: .command)` on Button or in `.commands {}`.
- **Reduced motion**: Check `UIAccessibility.isReduceMotionEnabled` and skip animations accordingly.
- **Color system**: Define semantic colors in `Assets.xcassets` with Light/Dark variants matching zinc scale.

## Files (web reference)
- `src/app/globals.css` — focus-visible ring, reduced-motion, slideUp keyframe
- `src/app/layout.tsx` — skip-to-content link
- `src/app/(main)/page.tsx` — skeleton loading, empty state, mobile FAB + bottom sheet, undo delete, keyboard shortcuts
- `src/app/loading.tsx` — skeleton loading
- `src/app/(main)/loading.tsx` — skeleton loading
- `src/components/Toast.tsx` — role="alert", aria-live, scaled timeout, action button support
- `src/components/ConfirmDialog.tsx` — role="dialog", aria-modal, focus trap, Escape key
- `src/components/EditVisitModal.tsx` — role="dialog", aria-modal, aria-label on close, Escape key, gray→zinc
- `src/components/VisitCard.tsx` — aria-labels, 44px touch targets, mobile-visible actions
- `src/components/ProcedureList.tsx` — 44px touch targets, aria-labels, gray→zinc
- `src/components/EntryForm.tsx` — 44px quantity buttons
- `src/components/RVUPicker.tsx` — data-search-input attribute, gray→zinc
- `src/components/Skeleton.tsx` — reusable skeleton component (new)
- `src/hooks/useKeyboardShortcuts.ts` — keyboard shortcut hook (new)
- All files with gray→zinc: sign-in, loading, privacy, FavoritesPicker, FavoriteGroupsPicker, BreakdownTable, BonusProjection
