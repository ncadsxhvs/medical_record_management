# Favorite Groups

## Status
- **Branch:** feat/code-group
- **Shipped:** 2026-04-07
- **Owner:** Claude Code
- **Related:** `docs/FEATURE_LOG.md` Entry 18

## Purpose
Let a clinician save the current set of procedures in the visit form as a **named template** (a "favorite group"), then re-add the entire set — including each code's quantity — to a future visit with a single tap. Eliminates the repetitive workflow of re-adding the same 3–6 codes and re-setting quantities every time the same kind of encounter occurs (e.g. "new patient + EKG + 2× injection").

This feature is **additive** — it does not modify the existing single-code favorites system. Both coexist.

## User Story
As a physician who repeatedly bills the same combination of HCPCS codes for a particular type of encounter, I want to save that combination (codes + quantities) as a named group, so that I can recreate the procedure list on a new visit with one tap instead of re-entering each code.

## User Flow

### Creating a new group
1. An **"+ Add Group"** button is always visible next to the "Favorite Groups" header.
2. Tapping it shows a prompt asking for a group name (1–100 characters, must be unique per user).
3. On confirm, management mode activates and an inline editor opens with the group name and an empty procedure list.
4. The user searches and adds HCPCS codes, sets quantities.
5. Tapping **"Create Group"** sends `POST /api/favorite-groups` with the name and items.
6. If the name conflicts, the API returns 409 and the UI shows an alert.
7. On success, the editor closes, the new group appears in the grid, and normal mode resumes.

### Adding a group to a visit
1. User opens the visit form (fresh or partially populated).
2. The **Favorite Groups** picker (top of form) lists each saved group as a tile showing the group name, the number of codes, and the total RVU sum (`Σ work_rvu × quantity`).
3. User taps a tile. Every code in the group is appended to the procedures list:
   - Codes already on the visit are **skipped** (their existing quantity is preserved — never overwritten).
   - Codes not yet on the visit are added with the **quantity stored in the group** (not defaulted to 1).
   - If a code in the group no longer exists in the RVU master list (stale), it is silently skipped and a warning is logged.
4. If **all** codes in the group are already on the visit, an alert is shown: `All codes from "<name>" are already on this visit.`

### Editing a group (isolated management mode)
1. An **"Edit"** button appears next to the "Favorite Groups" header.
2. Tapping **Edit** enters **management mode**:
   - Group tiles switch from "click to add to visit" to "click to select for editing".
   - Each tile shows **rename** and **delete** icons (no icons in normal mode).
   - The header button changes to **"Done"**.
3. Tapping a group tile in management mode **selects** it for editing:
   - The tile highlights blue with a "▼ SELECTED" indicator.
   - An **inline editor** expands below the grid showing:
     - An HCPCS search picker to add new codes to the group.
     - The group's procedures displayed with editable quantities and remove buttons (reuses `ProcedureList`).
     - **"Save Changes"** and **"Cancel"** buttons.
   - No date/time/notes fields or "Save Visit" button — editing is fully self-contained.
4. Tapping **"Save Changes"** sends `PUT /api/favorite-groups/{id}` with the updated items, closes the editor, and refreshes the group list.
5. Tapping **Cancel** closes the editor without saving.
6. Tapping **"Done"** exits management mode and returns to normal mode (also closes any open editor).

### Renaming a group
1. In management mode, select a group to open the inline editor.
2. A **"Rename"** button appears in the editor header next to the group name.
3. Tapping it shows a prompt pre-filled with the current name.
4. On confirm, sends `PUT /api/favorite-groups/{id}` with `{ "name": "<new>" }`.
5. If the new name conflicts with an existing group, the API returns 409 and the UI shows an alert.
6. On success, the editor title and group tile update immediately.

### Deleting a group
1. Tapping the **delete** (trash) icon shows a confirm dialog. On confirm, the group is deleted.

## Data Model

### Tables (Postgres)
```sql
CREATE TABLE favorite_groups (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE TABLE favorite_group_items (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER NOT NULL REFERENCES favorite_groups(id) ON DELETE CASCADE,
  hcpcs      VARCHAR(20) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 1000),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(group_id, hcpcs)
);
```
- `(user_id, name)` is unique → duplicate names per user produce a 409.
- `ON DELETE CASCADE` removes items when their parent group is deleted.
- `quantity` is constrained to `[1, 1000]` — same range as `visit_procedures.quantity`.

Migration: `scripts/add-favorite-groups.sql`. Apply with:
```
psql $POSTGRES_URL -f scripts/add-favorite-groups.sql
```

### TypeScript shape (returned by API)
```ts
interface FavoriteGroupItem {
  hcpcs: string;
  quantity: number;
  // hydrated from RVU cache on GET (omitted on POST/PUT input)
  description?: string;
  status_code?: string;
  work_rvu?: number;
}

interface FavoriteGroup {
  id: number;
  user_id: string;
  name: string;
  sort_order: number;
  items: FavoriteGroupItem[];
  created_at: string;
  updated_at: string;
}
```

## API

All endpoints require an authenticated session (web cookie) or a mobile JWT — same auth wrapper as the existing visits/favorites routes.

### `GET /api/favorite-groups`
Returns `FavoriteGroup[]` for the current user, ordered by `sort_order ASC, created_at ASC`. Each item is **hydrated** with `description`, `status_code`, and `work_rvu` from the in-memory RVU cache so the client can render totals without an extra round-trip.

### `POST /api/favorite-groups`
Body:
```json
{
  "name": "New patient w/ EKG",
  "items": [
    { "hcpcs": "99213", "quantity": 1 },
    { "hcpcs": "93000", "quantity": 2 }
  ]
}
```
Validation:
- `name` is required, trimmed, 1–100 chars.
- `items` is a non-empty array.
- Each `hcpcs` matches `/^[A-Za-z0-9]{4,5}$/`.
- `quantity` is an integer in `[1, 1000]`.
- No duplicate `hcpcs` within `items`.

Responses:
- `201` — created group with hydrated items.
- `400` — validation failure.
- `409` — group name already exists for this user.

The new group is auto-assigned `sort_order = max(existing) + 1`.

### `PUT /api/favorite-groups/{id}`
Body (both fields optional, but at least one should be supplied):
```json
{
  "name": "Updated name",
  "items": [{ "hcpcs": "99214", "quantity": 1 }]
}
```
- Verifies the group is owned by the authenticated user (404 otherwise).
- If `items` is supplied, **all existing items are deleted and replaced**.
- Same validation as POST.
- Updates `updated_at`.

### `DELETE /api/favorite-groups/{id}`
Cascades to `favorite_group_items` via FK. Returns `404` if not owned.

### `PATCH /api/favorite-groups`
Body: `{ "groups": [{ "id": 3 }, { "id": 1 }, { "id": 2 }] }`
Reorders by array index (group at index `i` → `sort_order = i`). Mirrors the existing favorites PATCH pattern.

## Web UI

### Components (Next.js / React)
- `src/components/FavoriteGroupsPicker.tsx` — fetches `/api/favorite-groups` on mount and on `refreshKey` change. Renders a grid of group tiles. Empty list is hidden entirely (matches the favorites picker behavior).
- `src/components/EntryForm.tsx` — mounts `<FavoriteGroupsPicker />` above the search/favorites grid. Adds a `Save as group` button next to the "Selected Procedures" header (only shown when the procedures list is non-empty).

### Merge semantics
Implemented in `src/lib/procedureUtils.ts`:
```ts
groupItemsToProcedures(items, existingHcpcs)
```
1. Filter out any item whose `hcpcs` is already in `existingHcpcs`.
2. For each remaining item, hydrate `description / status_code / work_rvu` (preferring the values returned by the GET endpoint, falling back to a search fetch if missing).
3. Build `VisitProcedure[]` carrying over each item's `quantity` (NOT clamped to 1).
4. Items whose HCPCS no longer resolves are skipped with a `console.warn`.

## Edge Cases
| Case | Behavior |
| --- | --- |
| Duplicate group name (same user) | API returns `409`; UI shows `alert("A group with that name already exists.")` |
| Empty `items` array on POST/PUT | API returns `400` |
| `quantity` out of range (<1 or >1000) | API returns `400` (UI never produces this — `handleQuantityChange` clamps min=1) |
| Invalid HCPCS format | API returns `400` |
| Stale HCPCS (removed from RVU master after group save) | Skipped on add, `console.warn` |
| All codes in group already on the visit | UI shows `alert("All codes from \"<name>\" are already on this visit.")` |
| Group code present + others missing on visit | Present codes preserved (existing quantity untouched), missing codes appended with their group quantity |
| User clears the form then taps Save as group | Button hidden (procedures.length === 0) |
| No-show visit form | "Save as group" hidden (no procedures to save) |
| Two tabs creating same name simultaneously | UNIQUE constraint → second one gets 409 |
| Edit mode is fully isolated | Group editing never touches the visit form procedures |
| Rename to same name (no change) | No API call, silently ignored |
| Rename to duplicate name | API returns 409, UI shows alert |
| Click group in normal mode | Adds to visit form (unchanged behavior) |
| Click group in management mode | Selects for inline editing (does not add to visit) |
| Group editor open | Visit form (search, favorites, procedures, save) is hidden; amber banner shown: "Finish editing the group before adding visits." |
| Group editor closed (Done / Cancel / Save) | Visit form re-appears |

## Acceptance Criteria
1. Migration creates `favorite_groups` and `favorite_group_items` tables with the FK and unique constraints.
2. Authenticated user can `POST /api/favorite-groups` with a name + items array and get a 201 with hydrated items.
3. `GET /api/favorite-groups` returns hydrated groups for the user, ordered by `sort_order, created_at`.
4. Duplicate names for the same user return `409`; same name for a different user is allowed.
5. `DELETE /api/favorite-groups/{id}` removes the group and cascades item rows.
6. Groups can be created via `POST /api/favorite-groups` with a name + items array.
7. Tapping a group tile appends the codes to the visit form, **preserving each item's saved quantity** and **skipping** any HCPCS already present.
8. If every code in a group is already on the visit, the user sees the "All codes already on this visit" alert.
9. Existing single-code `favorites` table, API, and `FavoritesPicker` UI are unchanged.
10. Tapping "Edit" next to the header enters management mode; group tiles show red pill "Delete" buttons and "Done" replaces "Edit".
11. Tapping a group tile in management mode selects it and opens an inline editor with HCPCS search, editable procedure list, Rename button, Save Changes, and Cancel — no visit form fields.
12. While a group is being edited, the visit form is blocked with an amber banner.
13. Saving changes via the inline editor replaces the group's items and refreshes the tile.
14. Renaming a group to a duplicate name shows a 409 alert.
15. In normal mode, group tiles have no action icons — click adds to visit.

## iOS / SwiftUI Reproduction Notes

A SwiftUI agent recreating this feature should follow these mappings:

### Models
```swift
struct FavoriteGroupItem: Codable, Identifiable {
    var id: String { hcpcs }
    let hcpcs: String
    let quantity: Int
    let description: String?
    let statusCode: String?
    let workRvu: Double?
}

struct FavoriteGroup: Codable, Identifiable {
    let id: Int
    let userId: String
    let name: String
    let sortOrder: Int
    let items: [FavoriteGroupItem]
    let createdAt: String
    let updatedAt: String
}
```
JSON keys are `snake_case` — use `JSONDecoder.keyDecodingStrategy = .convertFromSnakeCase`.

### Networking
- `GET /api/favorite-groups` → `[FavoriteGroup]`
- `POST /api/favorite-groups` body: `{ "name": String, "items": [{ "hcpcs": String, "quantity": Int }] }`
- `PUT /api/favorite-groups/{id}` body: `{ "name"?: String, "items"?: [...] }`
- `DELETE /api/favorite-groups/{id}` → 200 / 404
- `PATCH /api/favorite-groups` body: `{ "groups": [{ "id": Int }, ...] }`

Authenticate the same way the rest of the iOS app does (mobile JWT — see `src/lib/mobile-auth.ts` on the web side).

### View
- A `FavoriteGroupsView` showing a horizontal `LazyHGrid` (or vertical list) of `GroupChip` cards with `name`, `"\(items.count) codes · \(totalRvu, specifier: "%.2f") RVU"`.
- Embed it at the **top** of the visit composer (above the search picker and the favorites picker).
- An **"Edit"** button in the section header toggles management mode (`@State var isManaging = false`).
- In management mode: tapping a tile selects it (`@State var selectedGroup: FavoriteGroup?`) and shows an inline editor (HCPCS search + editable procedure list + Save/Cancel). Swipe-to-delete and rename (via context menu or long press) available on each tile.
- In normal mode: no icons on tiles, tapping adds to visit. "Done" button exits management mode.
- A `Save as group` button in the procedures section toolbar, disabled when `procedures.isEmpty`. Tapping it presents a `TextField` alert for the name; on submit, POST and refresh.

### Merge behavior helper (Swift)
```swift
func mergeGroupIntoVisit(group: FavoriteGroup,
                        existing: inout [VisitProcedure]) -> Int {
    let existingCodes = Set(existing.map { $0.hcpcs })
    var added = 0
    for item in group.items where !existingCodes.contains(item.hcpcs) {
        guard let desc = item.description,
              let status = item.statusCode,
              let rvu = item.workRvu else { continue } // stale
        existing.append(
            VisitProcedure(hcpcs: item.hcpcs,
                          description: desc,
                          statusCode: status,
                          workRvu: rvu,
                          quantity: item.quantity) // preserve!
        )
        added += 1
    }
    return added
}
```
If `added == 0`, present an alert: `"All codes from \"\(group.name)\" are already on this visit."`

### Local validation (mirror server)
- name: 1–100 chars after `trimmingCharacters(in: .whitespaces)`
- quantity: `1...1000`
- hcpcs: regex `^[A-Za-z0-9]{4,5}$`
- Treat 409 as a name conflict → show "A group with that name already exists." inline on the name field.

## Files
- `scripts/add-favorite-groups.sql` (new)
- `src/app/api/favorite-groups/route.ts` (new)
- `src/app/api/favorite-groups/[id]/route.ts` (new)
- `src/components/FavoriteGroupsPicker.tsx` (new)
- `src/components/EntryForm.tsx` (modified — mount picker, save-as-group button, handlers)
- `src/lib/procedureUtils.ts` (modified — `groupItemsToProcedures`)
- `src/lib/cache-keys.ts` (modified — `favoriteGroups` key)
- `src/types/index.ts` (modified — `FavoriteGroup`, `FavoriteGroupItem`)
