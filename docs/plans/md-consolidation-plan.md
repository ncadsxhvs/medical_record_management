# Markdown File Consolidation Plan

Audit of all `.md` files in the repo (excluding `node_modules` / `.next`) with a recommendation for each. **No implementation — review only.**

## Inventory

| # | File | Lines | Purpose | Recommendation |
|---|------|-------|---------|----------------|
| 1 | `README.md` | 36 | Project intro, quick start, feature list | **Keep** — standard repo entry point |
| 2 | `CLAUDE.md` | 390 | Claude dev guide: stack, structure, conventions, deployment | **Keep + trim** — overlaps with TASK.md and README |
| 3 | `MEMORY.md` | 47 | Concise project memory for Claude sessions | **Keep** — short, distinct from CLAUDE.md (memory vs guide) |
| 4 | `TASK.md` | 1110 | Phase-by-phase progress + per-feature implementation logs | **Consolidate** — duplicates `docs/FEATURE_LOG.md` |
| 5 | `docs/README.md` | 253 | API docs viewer guide (Swagger UI) | **Keep + trim** — could be much shorter |
| 6 | `docs/FEATURE_LOG.md` | 218 | Append-only feature/PR ledger (16 entries) | **Keep** — canonical feature log per `feature-ledger` skill |
| 7 | `docs/plans/task_plan.md` | 118 | Original "recreate the app" phase plan | **Archive/Delete** — historical, app already built |
| 8 | `docs/plans/progress.md` | 144 | Session log of the recreation effort | **Archive/Delete** — historical recreation log |
| 9 | `docs/plans/findings.md` | 251 | Architecture/decisions snapshot from recreation effort | **Archive/Delete** — duplicates CLAUDE.md content |
| 10 | `docs/plans/2026-02-28-api-test-suite.md` | 1030 | Specific implementation plan for the API test suite | **Archive** — completed plan, keep for history |
| 11 | `.claude/rules.md` | 60 | Feature summary template + git rules | **Keep** — Claude-specific operating rules |
| 12 | `.claude/skills/feature-ledger/SKILL.md` | 72 | Skill definition file | **Keep** — required by skill system |
| 13 | `.claude/skills/full-stack/SKILL.md` | 787 | Skill definition file | **Keep** — required by skill system |

---

## Identified Overlap

### A. Feature/PR Tracking — 3 sources of truth
- `TASK.md` (phase checklists + per-feature sections, ~1100 lines)
- `docs/FEATURE_LOG.md` (16 append-only entries)
- `CLAUDE.md` § "Recent Updates" (security patches, no-show, time tracking, etc.)

These all log "what shipped." `.claude/rules.md` and the `feature-ledger` skill point at `docs/FEATURE_LOG.md` as the canonical store.

**Proposal:** Make `docs/FEATURE_LOG.md` the single source of truth. Migrate per-feature sections from `TASK.md` and the "Recent Updates" block from `CLAUDE.md` into `FEATURE_LOG.md` entries. Delete `TASK.md` (or shrink to a top-level "what's next" file). Strip the "Recent Updates" section from `CLAUDE.md`.

### B. Project Overview — 4 sources of truth
- `README.md` (36 lines, public-facing)
- `CLAUDE.md` (390 lines, dev guide)
- `MEMORY.md` (47 lines, Claude context)
- `docs/plans/findings.md` (251 lines, recreation findings)

**Proposal:**
- `README.md` — keep as the public entry point.
- `CLAUDE.md` — trim to dev guide only (commands, conventions, file paths, gotchas). Remove duplicated tech-stack and feature lists already covered by `README.md`.
- `MEMORY.md` — keep as the short Claude pin.
- `docs/plans/findings.md` — delete (historical, content already lives in CLAUDE.md / README.md).

### C. `docs/plans/` — Historical recreation effort
Three of the four files (`task_plan.md`, `progress.md`, `findings.md`) describe a one-time effort to "recreate the app from scratch" that is already complete. They have no ongoing value beyond history.

**Proposal:** Move all completed plans into `docs/plans/archive/` (or delete). Going forward, `docs/plans/` holds only active/in-flight plans (e.g. this consolidation plan, future feature plans).

### D. `docs/README.md`
253 lines describing how to view the OpenAPI spec — but the spec is already served at `/api-docs` in-app and the `README.md` already links to it.

**Proposal:** Trim to ~30 lines: a one-paragraph pointer to `/api-docs` and a note about the location of `openapi.yaml`.

---

## Recommended End State

```
README.md                              # Public intro (keep as-is)
CLAUDE.md                              # Trimmed dev guide (~200 lines)
MEMORY.md                              # Claude memory pin (keep as-is)
docs/
  README.md                            # Trimmed API docs pointer (~30 lines)
  FEATURE_LOG.md                       # Single source of truth for shipped work
  features/                            # Per-feature summaries (per .claude/rules.md)
    analytics.md
    bonus-projection.md                # NEW — current branch
    ...
  plans/
    md-consolidation-plan.md           # This file (active)
    archive/
      2026-02-28-api-test-suite.md     # Completed
      task_plan.md                     # Historical recreation effort
      progress.md                      # Historical recreation effort
      findings.md                      # Historical recreation effort
.claude/
  rules.md                             # Keep
  skills/                              # Keep (required by skill system)
```

## Files to Delete Outright
- `TASK.md` (after migrating per-feature content into `FEATURE_LOG.md`)

## Files to Move to `docs/plans/archive/`
- `docs/plans/task_plan.md`
- `docs/plans/progress.md`
- `docs/plans/findings.md`
- `docs/plans/2026-02-28-api-test-suite.md`

## Files to Trim
- `CLAUDE.md` — remove "Recent Updates" section and any duplication with `README.md`
- `docs/README.md` — collapse to a short pointer

## Files to Keep As-Is
- `README.md`
- `MEMORY.md`
- `docs/FEATURE_LOG.md`
- `.claude/rules.md`
- `.claude/skills/**/SKILL.md`

---

## Open Questions Before Implementation
1. Migrate `TASK.md` per-feature sections into `FEATURE_LOG.md` verbatim, or summarize them into the existing entry format?
2. Archive (`docs/plans/archive/`) or hard-delete the historical recreation files?
3. Should the new `docs/features/bonus-projection.md` be created as part of this consolidation or as a separate task?
