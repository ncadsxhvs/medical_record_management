# Custom Codes

## Status
- **Branch:** feat/email-reminders
- **Shipped:** 2026-05-02
- **Related:** Feature Log Entry 28

## Purpose
Allow users to define custom HCPCS codes with their own RVU values and descriptions for procedures not in the standard RVU table.

## User Flow
1. User opens the main Log Visit screen.
2. User taps "+ Custom Code" below the search bar.
3. An inline form expands with three fields: Code, RVU value, Description.
4. User fills in the fields and taps "Save".
5. The form closes. The custom code is now searchable via the main search bar.
6. Custom codes appear in search results alongside standard codes (custom codes take priority if HCPCS matches).
7. User can select the custom code to add it to a visit like any standard code.

## UI Specification
- **"+ Custom Code" button:** text button, primary color, below the search input
- **Inline form** (shown when button tapped):
  - Code field: text input, placeholder "Code (e.g. CUSTOM1)"
  - RVU value field: text input with decimal keyboard, placeholder "RVU value"
  - Description field: text input, full width, placeholder "Description"
  - Save button: primary color, disabled until Code and Description are filled
  - Cancel button: secondary/outline style
- **In search results:** custom codes appear with status_code "C" and are listed before standard codes

## Data Model
```ts
type CustomCode = {
  id: number;
  user_id: string;
  hcpcs: string;       // uppercase, trimmed
  description: string;  // trimmed
  work_rvu: number;     // decimal, defaults to 0
  created_at: string;   // ISO timestamp
};
```

## Persistence
- **Table:** `custom_codes`
- **Columns:** id (serial PK), user_id (text, NOT NULL), hcpcs (text, NOT NULL), description (text, NOT NULL, default ''), work_rvu (numeric(10,2), NOT NULL, default 0), created_at (timestamptz, default now())
- **Constraints:** UNIQUE(user_id, hcpcs) — upserts on conflict
- **Indexes:** user_id, hcpcs
- **Migration:** `scripts/add-custom-codes.sql`

## API Contracts

### GET /api/custom-codes
- **Auth:** required (session or JWT)
- **Response 200:** `CustomCode[]`

### POST /api/custom-codes
- **Auth:** required
- **Request body:** `{ hcpcs: string, description: string, work_rvu?: string }`
- **Validation:** hcpcs and description required
- **Behavior:** upserts — if (user_id, hcpcs) exists, updates description and work_rvu
- **Response 201:** created/updated `CustomCode`
- **Error 400:** missing required fields

### DELETE /api/custom-codes/:id
- **Auth:** required
- **Behavior:** deletes by id AND user_id (prevents cross-user deletion)
- **Response 200:** `{ message: "Custom code removed" }`
- **Error 404:** not found

### GET /api/rvu/search?q=...
- **Modified:** now queries both standard RVU cache and custom_codes table in parallel
- **Custom codes override standard codes with the same HCPCS**
- **Custom code query catches errors silently** (`.catch(() => [])`)

## Business Logic
- Code is uppercased and trimmed before storage
- work_rvu defaults to 0 if not provided or not parseable
- Search merges custom + standard results, with custom codes listed first

## Edge Cases
- Empty code or description: Save button disabled
- Duplicate HCPCS for same user: upserts (updates existing)
- custom_codes table doesn't exist: API returns 500 (must run migration)
- Search with comma-separated values: custom codes query may fail, caught silently

## Acceptance Criteria
- [ ] User can create a custom code with code, description, and RVU value
- [ ] Custom code appears in search results when queried
- [ ] Custom codes override standard codes with same HCPCS
- [ ] Save button is disabled until code and description are filled
- [ ] Duplicate code for same user updates instead of erroring

## iOS / SwiftUI Notes
- "+ Custom Code" maps to a disclosure button expanding an inline Form section
- Use `@FocusState` for field navigation
- Store in Core Data with same schema; sync via API
- Search should merge local custom codes with API standard results

## Files (web reference)
- `src/components/RVUPicker.tsx` — custom code form UI
- `src/app/api/custom-codes/route.ts` — GET/POST endpoints
- `src/app/api/custom-codes/[id]/route.ts` — DELETE endpoint
- `src/app/api/rvu/search/route.ts` — merged search results
- `scripts/add-custom-codes.sql` — migration
