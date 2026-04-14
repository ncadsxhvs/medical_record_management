# Favorites Management

## Status
- **Branch:** feat/addbutton-for-fav
- **Shipped:** 2026-04-11
- **Owner:** Claude Code
- **Related:** `docs/FEATURE_LOG.md` Entry 20

## Purpose
Let clinicians manage their favorite HCPCS codes directly from the favorites picker — add new favorites via search, delete existing ones, and see which favorites are already on the current visit via green highlighting. Previously, adding favorites required using the main search picker's star toggle; deleting required a tiny hover-only `×`.

## User Story
As a physician, I want to quickly add and remove favorite HCPCS codes without leaving the favorites section, so I can keep my quick-add list current without extra clicks.

## User Flow

### Adding a favorite
1. User sees the "+ Add Favorite" button above the favorites grid.
2. Tapping it reveals an inline search input (auto-focused).
3. User types a code or description (min 2 chars). Results appear in a scrollable dropdown (max 20 results).
4. Codes already in favorites are grayed out with "(already added)".
5. Tapping a non-favorite result adds it via `POST /api/favorites`.
6. The favorites grid refreshes immediately.
7. User can add multiple codes without closing the search.
8. Tapping "Done" closes the search.

### Deleting a favorite
1. Each favorite tile shows a red pill button ("Delete" with trash icon), always visible (not hover-only).
2. Button is vertically centered on the right side of the tile.
3. Tapping it calls `DELETE /api/favorites/{hcpcs}` and refreshes the list.

### Visual selection feedback
1. When a favorite's HCPCS code is already added to the current visit procedures, the tile:
   - Background changes to green (`bg-green-50`)
   - Border changes to green (`border-green-300`)
   - Text shows green "✓ added" label
   - Tile is disabled (cannot add again)

## UI Specification

```
Favorites Section
├── "+ Add Favorite" button (green outline, always visible)
│   └── [when open] Search Panel
│       ├── Text input ("Add favorite by code or name...")
│       ├── "Done" button
│       └── Results dropdown (max-h 192px, scrollable)
│           └── Result row: [code] [description] [(already added)?]
├── Favorites Grid (2 cols mobile, 4 cols desktop)
│   └── Favorite Tile (draggable, sortable)
│       ├── Drag handle (left, 6-dot icon)
│       ├── HCPCS code label
│       ├── [if selected] "✓ added" green label
│       └── Delete button (right, red pill: trash icon + "Delete")
```

### Delete Button Style
Matches `VisitCard` delete button:
- `bg-red-50 text-red-600 rounded-lg`
- `hover:bg-red-100 active:bg-red-200`
- Trash SVG icon (w-4 h-4) + "Delete" text label
- Always visible, no hover required

### Selected State Style
- Background: `bg-green-50` (light green)
- Border: `border-green-300` (green)
- Text: `text-green-700 font-medium`
- Label: "✓ added" in `text-green-600 text-xs`
- Tile disabled, drag disabled

## Data Model
No new data — uses existing `favorites` table:
```ts
interface Favorite {
  id: number;
  user_id: string;
  hcpcs: string;
  sort_order: number;
  created_at: string;
}
```

## API Contracts
Uses existing endpoints — no changes:

### `POST /api/favorites`
- **Body:** `{ "hcpcs": "99213" }`
- **201:** Created favorite
- **409 (implicit):** `ON CONFLICT DO NOTHING` if already exists

### `DELETE /api/favorites/{hcpcs}`
- **200:** Deleted

### `GET /api/rvu/search?q=<query>&limit=20`
- Used by the add-favorite search
- **200:** `RVUCode[]`

## Edge Cases
| Case | Behavior |
| --- | --- |
| Search query < 2 chars | No results shown |
| Code already in favorites | Grayed out with "(already added)", click disabled |
| All favorites selected on visit | All tiles show green, all disabled |
| No favorites yet | Shows "No favorites yet" message + Add button |
| Network error on add/delete | Console error, favorites list unchanged |

## Acceptance Criteria
1. "+ Add Favorite" button is visible above the favorites grid.
2. Clicking it reveals a search input with auto-focus.
3. Typing 2+ chars shows RVU search results.
4. Clicking a result adds it to favorites and the grid updates.
5. Already-favorited codes show "(already added)" and are disabled.
6. "Done" closes the search panel.
7. Each favorite tile has an always-visible red pill delete button with trash icon + "Delete" text.
8. Clicking delete removes the favorite immediately.
9. Favorites already on the visit show green background, green border, and "✓ added".
10. Green tiles are disabled (cannot re-add).
11. Drag-and-drop reordering still works on non-selected tiles.

## Test Plan
- **E2E (Playwright):** `e2e/favorites.spec.ts` — 11 tests covering add button, search, done, delete visibility, green styling, group edit/rename/delete
- **Auth setup:** `e2e/auth.setup.ts` — JWT cookie injection using `AUTH_SECRET`
- **Manual:** Add a favorite via search, verify it appears. Add it to a visit, verify green. Delete it, verify removed.

## iOS / SwiftUI Notes
- "+ Add Favorite" → Button with `.sheet` presenting a `TextField` + `List` search view
- Delete button → `.swipeActions` with destructive role, or inline `Button` with `.buttonStyle(.bordered)` tinted red
- Green selected state → conditional `.listRowBackground(Color.green.opacity(0.1))` + overlay checkmark
- Search debounce → `Combine` publisher with `.debounce(for: 0.3)`
- Drag-and-drop → `List` with `.onMove` modifier

## Files
- `src/components/FavoritesPicker.tsx` (add search, delete style, green selection)
- `playwright.config.ts` (Playwright config with auth setup project)
- `e2e/auth.setup.ts` (JWT session cookie for authenticated tests)
- `e2e/favorites.spec.ts` (11 e2e tests)
- `.gitignore` (playwright artifacts)
