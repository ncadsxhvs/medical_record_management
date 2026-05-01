# Project Rules (ENFORCED)

---

## Skill Routing

| When | Skill/Plugin | Stage |
|------|-------------|-------|
| UI/UX planning & design decisions | `/ui-ux-pro-max:ui-ux-pro-max` | During planning (step 2) |
| Any feature build (multi-file) | `harness-design` | Right after planning (step 3) |
| UI polish, component architecture, bias corrections | `taste-skill` | During implementation |
| Feature planning & execution | `superpowers` skills | As needed |

---

## PR Summary to Brain Base (MANDATORY)

Every PR — before pushing — MUST write a summary file to:

```
/Users/ddctu/git/brain_base/raw/trackmyrvu/<YYYY-MM-DD>-<slug>.md
```

**Slug:** lowercase, hyphens, max 60 chars (e.g. `ux-redesign-split-panel`, `bonus-projection`, `no-show-tracking`).

### Format

```md
# <PR Title>

- **Date:** YYYY-MM-DD
- **Branch:** <branch name>
- **PR:** <PR URL or "pending">

## What Changed
Bullet list of user-facing and technical changes.

## Why
One paragraph: the problem or need this addresses.

## Key Decisions
Bullets: non-obvious choices made and why.

## Files Changed
- `path/to/file.tsx` — what changed
- `path/to/file.ts` — what changed

## How to Verify
Exact steps to test the changes work.
```

### Rules
- Write the file BEFORE `git push` or `gh pr create`
- One file per PR — update it if the PR changes
- Do NOT delete old entries — they form the project history
- If the PR is trivial (typo, dependency bump), still write the file but keep it short

---

## Documentation on Code Changes

Every PR that touches `src/`, `scripts/`, or `data/` MUST also update:

1. **`docs/FEATURE_LOG.md`** — append a new entry at the top
2. **`docs/features/<feature-name>.md`** — create or update the spec

CI (`.github/workflows/docs-check.yml`) blocks merges without these.

### Feature Spec Requirements
The spec must be detailed enough that another Claude Code agent on a **SwiftUI iOS project** can reproduce the feature without reading the web source code:
- Describe behavior, contracts, and UX — not React/Tailwind code
- Use platform-neutral terms ("primary button", "modal sheet", "list row")
- Provide exact data shapes, formulas, validation rules, and acceptance criteria
- Include iOS/SwiftUI mapping notes at the end

### Feature Spec Template — `docs/features/<feature-name>.md`

```md
# <Feature Name>

## Status
- **Branch:** feat/<name>
- **Shipped:** YYYY-MM-DD
- **Related:** links to FEATURE_LOG entry, PRs

## Purpose
What this feature does and why a user wants it.

## User Flow
1. User opens <screen>.
2. User taps <control>.
3. System shows <result>.

## UI Specification
List every visible element with type, label, default, validation, states.

## Data Model
```ts
type Example = { field: type; };
```

## Persistence
Where, key/table, lifetime, migration rules.

## API Contracts
Method, path, auth, request/response, errors.

## Business Logic
Pseudocode for non-trivial computation.

## Edge Cases
Empty data, divide-by-zero, invalid input, network failure.

## Acceptance Criteria
- [ ] Concrete, testable checklist items

## iOS / SwiftUI Notes
Platform mapping for recreation.

## Files (web reference)
- `src/...`
```

### Feature Log Entry — `docs/FEATURE_LOG.md`

Append at top:

```md
## Entry <N>
- **Date:** YYYY-MM-DD
- **Title:** <type>(<scope>): <summary>
- **Branch:** feat/<name>
- **Spec:** [docs/features/<name>.md](features/<name>.md)
- **What changed:** bullets
- **Files touched:** paths
- **How to verify:** steps
```

---

## Git Rules

### Commits
- Concise messages summarizing the "why"
- Never amend published commits
- Never force push to main

### Pull Requests
- Always open PRs — never merge directly to main
- Use `gh pr create`, never `gh pr merge` or `git merge` into main
- Push feature branches with `git push -u origin <branch>`
- CI must pass before merge

### Branches
- `feat/<name>`, `fix/<name>`, `chore/<name>`

---

## Pre-Push Checklist

Before every `git push`:

1. Brain base summary written to `/Users/ddctu/git/brain_base/raw/trackmyrvu/`
2. `docs/FEATURE_LOG.md` updated (if `src/`/`scripts/`/`data/` changed)
3. `docs/features/<name>.md` created or updated (if applicable)
4. Build passes (`npm run build`)
5. Tests pass (`npm test`)
