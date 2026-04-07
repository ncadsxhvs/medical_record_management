# Feature Specs

This directory holds **platform-agnostic feature specifications**. Each file describes one feature in enough detail that another Claude Code agent — including one working on a **SwiftUI iOS project** — can reproduce the feature without reading the web source code.

## Rules

- One file per feature: `docs/features/<feature-name>.md` (kebab-case)
- Use the template defined in [`.claude/rules.md`](../../.claude/rules.md)
- Update the spec on **every** behavioral change, not just on initial creation
- CI (`.github/workflows/docs-check.yml`) blocks PRs that change source without updating both this directory and `docs/FEATURE_LOG.md`

## What "platform-agnostic" means

- Describe **behavior, data, formulas, UX** — not React/Tailwind code
- Use neutral terms: "primary button", "modal sheet", "date picker", "list row"
- Provide exact data shapes, validation rules, business logic, and acceptance criteria
- Add an "iOS / SwiftUI Notes" section mapping web concepts to SwiftUI equivalents

## Index

- [bonus-projection.md](bonus-projection.md) — RVU bonus projection panel on the analytics dashboard
