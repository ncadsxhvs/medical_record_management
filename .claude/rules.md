# Feature Summary Rule

## When to trigger
After implementing or modifying a feature, create or update a summary file in `/docs/features/<feature-name>.md`.

## Summary format
```md
# [Feature Name]

## Purpose
One sentence describing what this feature does and why it exists.

## UI Components
- Component name: description, location in codebase
- List every visible UI element (buttons, inputs, modals, etc.)

## Behavior
- List key interactions and state changes
- Include edge cases and error states

## Data / Props
- Key data structures, props, or API calls involved

## File Locations
- Main component: `src/components/...`
- Styles: `src/styles/...`
- Logic/hooks: `src/hooks/...`
- Tests: `src/tests/...`

## Dependencies
- Libraries or other features this depends on

## Recreate Checklist
- [ ] Step 1 to recreate from scratch
- [ ] Step 2
- [ ] Step 3
```

## Rules
- Keep each section to 3-5 bullet points max
- No prose — use bullets and short phrases only
- Be specific enough that another agent can recreate identical UI without seeing the original code
- Always include exact file paths
- Update the summary whenever the feature changes