# Data Model — TrackMyRVU

## Entity Relationship Diagram

```
┌─────────────────────────┐
│         users            │
├─────────────────────────┤
│ id          TEXT PK      │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ email       TEXT UNIQUE  │                                                    │
│ name        TEXT         │        All child tables: ON DELETE CASCADE          │
│ image       TEXT         │                                                    │
│ created_at  TIMESTAMP    │                                                    │
│ updated_at  TIMESTAMP    │                                                    │
└────┬────┬────┬────┬────┬─┘                                                    │
     │    │    │    │    │                                                       │
     │    │    │    │    └──────────────────────────────────────────┐             │
     │    │    │    └─────────────────────────────┐                 │             │
     │    │    └──────────────────┐               │                 │             │
     │    └────────┐              │               │                 │             │
     ▼             ▼              ▼               ▼                 ▼             │
┌────────────┐ ┌───────────┐ ┌───────────────┐ ┌─────────────┐ ┌──────────────┐ │
│  visits     │ │ favorites │ │favorite_groups│ │ custom_codes│ │user_settings │ │
├────────────┤ ├───────────┤ ├───────────────┤ ├─────────────┤ ├──────────────┤ │
│ id      PK │ │ id     PK │ │ id         PK │ │ id       PK │ │ id        PK │ │
│ user_id FK │ │ user_id FK│ │ user_id    FK │ │ user_id  FK │ │ user_id   FK │ │
│ date   DATE│ │ hcpcs     │ │ name          │ │ hcpcs       │ │ rvu_target   │ │
│ time   TIME│ │ sort_order│ │ sort_order    │ │ description │ │ target_start │ │
│ notes      │ │ created_at│ │ created_at    │ │ work_rvu    │ │ target_end   │ │
│ is_no_show │ │ updated_at│ │ updated_at    │ │ created_at  │ │ bonus_rate   │ │
│ created_at │ ├───────────┤ └──────┬────────┘ ├─────────────┤ │ reminder_on  │ │
│ updated_at │ │UQ(user_id,│        │          │UQ(user_id,  │ │ created_at   │ │
└─────┬──────┘ │   hcpcs)  │        │          │   hcpcs)    │ │ updated_at   │ │
      │        └───────────┘        │          └─────────────┘ ├──────────────┤ │
      │ CASCADE                     │ CASCADE                   │CHK(end>=start│ │
      ▼                             ▼                           └──────────────┘ │
┌─────────────────┐   ┌──────────────────────┐                                   │
│visit_procedures  │   │favorite_group_items   │                                  │
├─────────────────┤   ├──────────────────────┤                                   │
│ id           PK │   │ id                PK │                                   │
│ visit_id     FK │   │ group_id          FK │                                   │
│ hcpcs           │   │ hcpcs                │                                   │
│ description     │   │ quantity    CHK 1-1K │                                   │
│ status_code     │   │ sort_order           │                                   │
│ work_rvu        │   ├──────────────────────┤                                   │
│ quantity CHK1-1K│   │ UQ(group_id, hcpcs)  │                                   │
│ created_at      │   └──────────────────────┘                                   │
└─────────────────┘                                                              │
                                                                                 │
┌─────────────────┐                                                              │
│   rvu_codes      │  (reference data, 16K+ rows)                               │
├─────────────────┤  No FK from other tables — custom_codes extend this set      │
│ id           PK │                                                              │
│ hcpcs    UNIQUE │                                                              │
│ description     │  GIN index (full-text search)                                │
│ status_code     │                                                              │
│ work_rvu        │                                                              │
│ created_at      │                                                              │
└─────────────────┘                                                              │
                                                                                 │
┌─────────────────┐                                                              │
│ entries (VIEW)   │  Backward-compat view over visits + visit_procedures         │
└─────────────────┘                                                             ─┘
```

## Tables

### users
Auth accounts via Google OAuth. `id` = email address.

### visits
Patient encounters. One visit has many procedures.

### visit_procedures
Line items per visit. Stores denormalized description/work_rvu for point-in-time medical record accuracy. `ON DELETE CASCADE` from visits.

### favorites
User's quick-access procedure codes, drag-and-drop ordered via `sort_order`.

### favorite_groups / favorite_group_items
Named bundles of (hcpcs, quantity) for one-click visit creation. Items cascade-delete with their group.

### custom_codes
User-defined HCPCS codes not in the master `rvu_codes` table.

### user_settings
Per-user RVU targets, bonus rates, and reminder preferences.

### rvu_codes
Master reference table with 16,852 standard HCPCS codes. Loaded once, cached in-memory (~5ms search).

## Key Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| visits | (user_id, date DESC) | Main query: user's visits by date |
| visits | (user_id, is_no_show, date) | Analytics filtering |
| visit_procedures | (visit_id) | JOIN from visits |
| visit_procedures | (hcpcs) | Code lookups |
| favorites | (user_id, sort_order) | Ordered favorites list |
| favorite_group_items | (group_id, sort_order) | Ordered items in group |
| rvu_codes | GIN(description) | Full-text search |

## Constraints

- All `user_id` FKs → `users(id) ON DELETE CASCADE`
- `visit_procedures.visit_id` → `visits(id) ON DELETE CASCADE`
- `favorite_group_items.group_id` → `favorite_groups(id) ON DELETE CASCADE`
- `visit_procedures.quantity` CHECK 1–1000
- `favorite_group_items.quantity` CHECK 1–1000
- `user_settings` CHECK end_date >= start_date
- No FK on `hcpcs` columns — intentional, since custom_codes exist outside rvu_codes
