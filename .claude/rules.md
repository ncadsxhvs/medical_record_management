# Documentation Rules (ENFORCED)

Every PR that touches `src/`, `scripts/`, or `data/` MUST update **both**:

1. `docs/FEATURE_LOG.md` — append a new entry at the top.
2. `docs/features/<feature-name>.md` — create or update the spec.

CI (`.github/workflows/docs-check.yml`) blocks merges that violate this rule.
The PR template (`.github/pull_request_template.md`) carries the checklist.

---

## Why Platform-Agnostic?

The feature spec must be detailed enough that **another Claude Code agent on a SwiftUI iOS project** can reproduce the feature **without reading the web source code**.

That means:
- Describe **behavior, contracts, and UX**, not React/Tailwind code.
- Use plain English, pseudocode, and platform-neutral terms ("primary button", "modal sheet", "list row", "date picker").
- Provide exact data shapes, formulas, validation rules, and acceptance criteria.
- Mention iOS-specific notes (SwiftUI control mapping, persistence equivalents) at the end.

---

## Feature Spec Template — `docs/features/<feature-name>.md`

```md
# <Feature Name>

## Status
- **Branch:** feat/<name>
- **Shipped:** YYYY-MM-DD
- **Owner:** <agent or person>
- **Related:** <links to FEATURE_LOG entry, PRs, issues>

## Purpose
One paragraph: what this feature does and why a user wants it.

## User Story
As a <role>, I want to <action>, so that <outcome>.

## User Flow
Numbered, step-by-step, from entry point to completion. Include alternate paths.
1. User opens <screen>.
2. User taps <control>.
3. System shows <result>.
4. ...

## UI Specification (platform-agnostic)
List EVERY visible element. For each:
- **Type:** button / text input / number input / date picker / toggle / list row / modal / card / chart
- **Label:** exact display text
- **Placeholder / default:**
- **Validation:** allowed values, min/max, required/optional
- **States:** default, focused, disabled, loading, error, success
- **Layout hints:** grouping, ordering, responsive behavior

Describe screen hierarchy as a tree:
```
Screen
└── Section
    ├── Control A
    └── Control B
```

## Data Model
TypeScript-style or JSON Schema. NOT framework-specific.
```ts
type ExampleSettings = {
  rvuTarget: number;        // RVUs, >= 0
  targetStartDate: string;  // ISO YYYY-MM-DD
  targetEndDate: string;    // ISO YYYY-MM-DD, >= targetStartDate
  bonusRate: number;        // dollars per RVU, >= 0
};
```

## Persistence
- **Where:** localStorage / Postgres table / UserDefaults / Core Data / file
- **Key / table:** exact name
- **Lifetime:** session / permanent / N days
- **Migration rules:** how to handle older formats

## API Contracts
For each endpoint touched (omit if pure client-side):
- **Method + Path:** `POST /api/visits`
- **Auth:** session cookie / JWT / none
- **Request body:**
  ```json
  { "date": "2026-04-01", "procedures": [...] }
  ```
- **Response 200:**
  ```json
  { "id": 123, ... }
  ```
- **Errors:** status codes + meanings

## Business Logic / Algorithms
Pseudocode for any non-trivial computation. Be exact.
```
daysInRange    = (endDate - startDate) + 1
annualizedRvu  = (actualRvus / daysInRange) * 365
annualTarget   = rvuTarget * (365 / daysInTargetPeriod)
surplus        = max(0, annualizedRvu - annualTarget)
projectedBonus = surplus * bonusRate
proratedBonus  = projectedBonus * (daysInTargetPeriod / 365)
```

## Edge Cases & Error States
- Empty data set
- Single-day range (avoid divide-by-zero)
- End date before start date (validate, show error)
- Negative or non-numeric input
- Network failure / unauthenticated user
- ...

## Acceptance Criteria
Concrete, testable. A reviewer can check each one.
- [ ] User can set RVU target via numeric input
- [ ] Default target period is Jan 1 – Dec 31 of current year
- [ ] Annualized pace updates live as target changes
- [ ] Settings survive page reload
- [ ] ...

## Test Plan
- **Unit:** what to test in isolation
- **Integration:** what API/DB flows to test
- **Manual:** exact steps to reproduce in the running app

## iOS / SwiftUI Notes
Mapping for an iOS engineer recreating this feature:
- Web `<input type="date">` → SwiftUI `DatePicker`
- Web `localStorage` → `@AppStorage` or `UserDefaults`
- Web `useState` → `@State`
- Web SWR → `URLSession` + `@Observable` or async/await
- Web modal → `.sheet` modifier
- Tailwind `grid grid-cols-3` → `LazyVGrid(columns: 3)`
- Hex / Tailwind colors → SwiftUI `Color` equivalents
- Animations → `.animation(.easeInOut)`

## Files (web reference, for traceability only)
- `src/components/...`
- `src/app/...`
- `src/lib/...`
```

---

## Feature Log Entry Template — `docs/FEATURE_LOG.md`

Append at the top, immediately after the `---` header.

```md
## Entry <N>

- **Date:** YYYY-MM-DD
- **Title:** <type>(<scope>): <imperative summary>
- **Branch:** feat/<name>
- **Spec:** [docs/features/<feature-name>.md](features/<feature-name>.md)
- **What changed:**
  - Bullet 1
  - Bullet 2
- **Files touched:** `path/one.tsx`, `path/two.ts`
- **Risk/Notes:** breaking change? migration? perf?
- **How to verify:** exact commands or click path
```

---

## Rules

- Keep prose minimal — bullets and short phrases.
- Be exact about file paths, formulas, and validation.
- A SwiftUI engineer who has never seen this codebase must be able to ship the same feature using only the spec.
- Update the spec on every behavioral change, not just on initial creation.

---

# Git Rules

## Commits
- Concise messages summarizing the "why"
- Never amend published commits
- Never force push to main

## Pull Requests
- Always open PRs — never merge directly to main
- Use `gh pr create`, never `gh pr merge` or `git merge` into main
- Push feature branches with `git push -u origin <branch>`
- CI must pass (`docs-check` included) before merge

## Branches
- `feat/<name>`, `fix/<name>`, `chore/<name>`
