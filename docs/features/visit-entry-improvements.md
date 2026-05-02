# Visit Entry Improvements

## Status
- **Branch:** feat/email-reminders
- **Shipped:** 2026-05-02
- **Related:** Feature Log Entry 28

## Purpose
Collection of UX improvements to the visit entry workflow: better date input, date persistence, button layout, procedure removal, favorite tooltips, daily RVU totals, and default favorites.

## Features

### 1. Date Input (MM/DD/YYYY)
Replaces native `<input type="date">` with a text-based date input.

**User Flow:**
1. User sees date field pre-filled with today's date in MM/DD/YYYY format.
2. User types digits; slashes auto-insert after month and day.
3. "Today" button resets to current date.

**Validation:**
- Month: 1-12
- Day: 1-31
- Year: 2000-2099
- Only digits and slashes accepted; non-numeric input ignored
- Incomplete dates are not submitted

**Data conversion:**
- Display format: MM/DD/YYYY
- Internal format: YYYY-MM-DD (ISO)
- Conversion uses `parseLocalDate()` from dateUtils (never `new Date(str)`)

### 2. Date Persistence
When user manually changes the date, it persists for the next encounter.

**Behavior:**
- State `isDateManuallyEdited` tracks whether user changed the date from today
- After saving a visit, if date was manually edited, it stays; otherwise resets to today
- "Clear" button preserves manually edited date
- "Today" button resets `isDateManuallyEdited` to false

### 3. Button Layout Swap
No Show and Save Visit buttons swapped for better UX.

**Layout (left to right):** No Show | Clear | Save Visit

### 4. Minus Button Removes at Quantity 1
In procedure lists (visit entry and favorite group editor), the minus button removes the procedure when quantity is 1 instead of being stuck.

**Behavior:**
- Quantity > 1: minus decreases by 1
- Quantity = 1: minus removes the procedure entirely
- Aria label changes: "Decrease quantity" vs "Remove procedure"

### 5. Favorite Description Tooltip
Truncated favorite descriptions show full text on hover via HTML title attribute.

### 6. Daily RVU Totals in Visit Log
Each date header in the visit log shows the total RVUs for that day.

**Display:** `{date} ——— {total} RVU` (right-aligned, blue mono text)
**Calculation:** Sum of `work_rvu * quantity` for all procedures in non-no-show visits on that date.

### 7. Default Favorites for New Users
New users are auto-seeded with common E/M codes on first favorites fetch.

**Default codes:** 99213, 99214, 99215, 99203, 99204
**Behavior:** GET /api/favorites checks if user has 0 favorites, inserts defaults with `ON CONFLICT DO NOTHING`, then re-fetches.

## UI Specification
- **DateInput:** text input with `inputMode="numeric"`, placeholder "MM/DD/YYYY", "Today" pill button
- **Procedure card layout:** code + delete button on top row, description below, quantity controls + RVU on bottom row with `flex-wrap` for mobile
- **Button sizes:** 36px min touch targets (reduced from 44px for density)
- **Daily RVU badge:** `text-xs font-mono font-semibold text-[#0070cc]`

## Data Model
No new data model — uses existing visits, visit_procedures, favorites tables.

## API Contracts

### GET /api/favorites (modified)
- **New behavior:** if user has 0 favorites, seeds defaults before returning
- **Default HCPCS:** ['99213', '99214', '99215', '99203', '99204']
- **Insert:** `ON CONFLICT DO NOTHING` (safe for concurrent requests)

## Edge Cases
- Date input with partial entry (e.g., "05/"): not submitted, no error shown
- Backspace through slashes: auto-removes preceding slash
- No visits on a date: no RVU badge shown (only shows when > 0)
- Default favorites already exist: `ON CONFLICT DO NOTHING` prevents duplicates

## Acceptance Criteria
- [ ] Date field accepts typed digits with auto-slash formatting
- [ ] "Today" button resets date and clears manual edit state
- [ ] Manually changed date persists after saving a visit
- [ ] No Show button is on the left, Save Visit on the right
- [ ] Minus button at qty=1 removes the procedure
- [ ] Hovering truncated favorite shows full description tooltip
- [ ] Daily RVU total appears next to each date header in visit log
- [ ] New user with no favorites sees 5 default E/M codes

## iOS / SwiftUI Notes
- DateInput: use `TextField` with custom `Formatter` or `onChange` for auto-slash insertion; `inputMode="numeric"` maps to `.keyboardType(.numberPad)`
- Date persistence: store in `@State` or `@AppStorage`; reset logic in save handler
- Button layout: `HStack { noShowButton; clearButton; Spacer(); saveButton }`
- Minus-to-remove: conditional action in stepper's decrement handler
- Tooltip: use `.help()` modifier or long-press popover
- Daily totals: computed property grouping visits by date
- Default favorites: seed on first launch via UserDefaults flag

## Files (web reference)
- `src/components/DateInput.tsx` — date input component
- `src/components/EntryForm.tsx` — date persistence, button swap
- `src/components/SelectedProceduresCard.tsx` — button swap, DateInput
- `src/components/ProcedureList.tsx` — minus-to-remove, responsive layout
- `src/components/FavoritesPicker.tsx` — description tooltip
- `src/app/(main)/page.tsx` — daily RVU totals, equal column layout
- `src/app/api/favorites/route.ts` — default favorites seeding
