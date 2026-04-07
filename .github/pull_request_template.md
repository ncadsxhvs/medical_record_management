# Pull Request

## Summary
<!-- 1–3 sentences. What and why. -->

## Changes
<!-- Bullet list of the user-visible changes. -->
-

## Documentation Checklist (REQUIRED)

CI will fail if these are not satisfied when source files under `src/`, `scripts/`, or `data/` change.

- [ ] Added a new entry at the top of `docs/FEATURE_LOG.md` (Date, Title, Branch, What changed, Files touched, Risk, How to verify)
- [ ] Added or updated a feature spec in `docs/features/<feature-name>.md` using the template in `.claude/rules.md`
- [ ] The feature doc is **platform-agnostic** and detailed enough that another Claude Code agent could reproduce the feature on an **iOS / SwiftUI** project without reading the web source code
- [ ] Updated `CLAUDE.md` and/or `MEMORY.md` if conventions, file paths, or critical workflows changed
- [ ] Updated `README.md` if user-facing features or setup steps changed

## Test Plan
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Manual verification:
  -

## Screenshots / Recordings (UI changes)
<!-- Drop images or links here. -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
