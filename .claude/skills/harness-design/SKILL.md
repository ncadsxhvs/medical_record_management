---
name: harness-design
description: Use when building a multi-file feature autonomously (schema + API + UI + tests + docs) that should iterate until mechanically verified, not stop at first compile. Also use when user says "run the harness," "ship this end-to-end," or "planner/generator/evaluator."
---

# Harness Design Skill

A four-agent harness — **Researcher**, **Planner**, **Generator**, **Evaluator** — wrapped in a Ralph loop. The harness exists because a single agent grading its own work tends to declare victory too early. Splitting the work into a builder and a skeptical critic, and refusing to exit the loop until the critic passes, is what gets a feature from "looks fine" to "actually works."

## When to invoke this skill

Use the harness when **all** of these are true:

- The task is a feature build, not a one-shot edit. (A multi-file change with schema/API/UI/test/docs slices.)
- The user wants the agent to keep going until done, not pause for confirmation after each step.
- There is a way to mechanically verify "done" — tests, a running app to click through, an OpenAPI contract, a migration that has to apply cleanly.
- The expected wall-clock is at least ~30 minutes of agent work.

If any of those is false, do not use the harness. Just do the task directly. The harness has real overhead (orchestration, token cost, file shuffling) and is wasted on small edits.

## The four agents

Each agent runs as a separate context. They do not share scratchpads. They communicate only through files in the working directory. This isolation is load-bearing — it is what prevents the generator from rationalizing its own work into a passing grade.

### Researcher

**Input:** The user's prompt + the project's CLAUDE.md.

**Runs as:** A sub-agent (Explore type) — reads files, greps patterns, checks schema, but writes no code.

**Output:** A research brief written to `harness-runs/<timestamp>-<slug>/research.md`.

**Job:** Answer these specific questions for the Planner:

1. **Relevant schema** — What existing DB tables/columns relate to this feature? Include column names, types, and key constraints.
2. **API route patterns** — How does the project structure API routes? What auth wrappers, error handling, and response shapes are used? Cite a representative example route.
3. **Nearby UI components** — What existing components and state patterns are similar to what this feature needs? File paths + brief description.
4. **Project conventions** — Date handling, cache keys, styling system, doc requirements, testing patterns. Anything from CLAUDE.md that applies.
5. **Reusable utilities** — What functions already exist that the feature should use instead of reimplementing? File paths + function signatures.
6. **Known landmines** — What does CLAUDE.md flag as recurring failure modes? (e.g., date parsing, auth edge cases, env file rules)

**Format:** Structured markdown with one section per question above. Each section includes file paths and short code excerpts (function signatures, type definitions) — not full file contents.

**Constraint:** Max ~2000 words. Summarize, don't dump. The Planner reads this instead of reading raw files. If the Researcher is unsure about something, it should say so explicitly rather than guessing.

**Interactive handoff:** After the Researcher completes `research.md`, do NOT proceed directly to the Planner. Instead, present the user with:

1. **Open questions** — Anything the research couldn't resolve or where multiple approaches exist. E.g., "Should this live in the existing settings table or a new one?" or "The codebase has two auth patterns — which applies here?"
2. **Outline** — A brief bullet-point outline of the proposed feature scope based on what the research found. Not a full spec — just enough for the user to confirm direction or redirect.

Wait for the user to respond before writing the plan. This back-and-forth prevents the Planner from committing to an approach the user didn't want. The Planner only runs after the user confirms the outline.

### Planner

**Input:** The user's prompt + the research brief at `research.md`.

**Output:** A full feature spec written to `harness-runs/<timestamp>-<slug>/spec.md`.

**Job:** Expand the short prompt into a complete spec covering:

- Product context and user stories
- Data model changes (tables, columns, migration plan)
- API contract (routes, request/response shapes, auth requirements)
- UI surface (screens, components, interactions)
- Acceptance criteria phrased as testable behaviors — these become the evaluator's contract
- Edge cases and explicit non-goals
- Dependencies on existing code (which files will be touched, which conventions apply)

**Constraints:**

- The Planner should NOT read raw source files. All codebase context comes from `research.md`. If the research is insufficient, note what's missing in the spec so the Generator can investigate.
- Reference specific utilities and patterns from the research brief by file path.
- Be ambitious about scope but stay at the product/architecture level. Do not specify granular implementation (variable names, exact SQL syntax, component file structure). The generator decides those, because if the planner gets a low-level detail wrong the error cascades.
- If the project has a feature-spec template in `.claude/rules.md` or `docs/features/`, conform to it. Reuse the template; do not invent a new one.
- If the project has existing conventions (date utilities, auth patterns, cache-key files, state management rules), call them out explicitly in the spec. The generator will read this spec without seeing the rest of the codebase upfront.
- Identify whether AI-driven features make sense in the product and propose them. The article specifically highlights this as a planner job.

**Verify before handoff:** The spec must be reproducible — another agent reading only the spec should be able to build the feature. If the planner skips data model details, auth handling, or success criteria, the generator will fill the gap with bad guesses.

### Generator

**Input:** The spec at `spec.md`.

**Output:** Working code on a feature branch, plus a self-evaluation log at `harness-runs/<timestamp>-<slug>/generator-log.md`.

**Job:** Implement the spec. Work in slices, not all at once. A typical slice for a full-stack feature:

1. Schema migration (apply on an ephemeral DB, never prod or shared dev)
2. Types / shared interfaces
3. API route(s) with auth handling for both web session and mobile JWT if the project supports both
4. UI component(s) with state, error states, loading states
5. Tests for new code paths
6. Documentation updates (feature log entry, feature spec, OpenAPI changes)

**Sprint contract step (do this before writing code for each slice):** Write a short contract to `contract-<slice>.md` listing exactly what the slice will produce and how the evaluator will verify it. The evaluator reads the contract before grading. Negotiating "done" upfront prevents the evaluator from moving goalposts mid-grade and prevents the generator from declaring shippable on a half-built slice.

**Self-checks before handing off to the evaluator:**

- `npm run build` (or the project's equivalent) passes
- Test suite passes; new code has at least one test
- Migration applies cleanly to a fresh database
- No `new Date(string)` calls if the project flags this as a date-handling pitfall — use the project's date utilities
- Documentation files updated per project rules
- Git diff is committed to the feature branch

**Important:** The generator's self-evaluation is unreliable. The article calls this out directly — agents grading their own work skew positive. Self-checks catch obvious failures (compile errors, test failures), but the generator should never decide the slice is "done." Only the evaluator decides that.

### Evaluator

**Input:** The spec, the contract, the running application (started by the harness), the generator's branch.

**Output:** A graded report at `harness-runs/<timestamp>-<slug>/evaluator-report-N.md`.

**Job:** Skeptically verify the slice against the contract using **actual execution**, not code reading alone. The evaluator must:

1. Spin up the app (or attach to a running preview) and click through the user flow with Playwright. Take screenshots. Inspect console errors. Test the actual UI, not just the components in isolation.
2. Hit the API directly with `curl` or fetch. Verify request validation, response shape, status codes, auth (both authenticated and unauthenticated paths).
3. Inspect the database after operations to verify state is what the spec claims it should be.
4. Read the diff and grade code quality — not just "does it compile" but "does it follow project conventions, does it duplicate existing utilities, does it leave dead code."

**Hard-threshold grading criteria.** Each criterion has a pass/fail bar. Any single failure means the slice fails and the generator gets specific feedback to fix.

| Criterion | Pass bar |
|---|---|
| Spec conformance | 100% of acceptance criteria from the contract demonstrably work end-to-end |
| Build & tests | `npm run build` passes; full test suite passes; new code has new tests |
| API contract | If OpenAPI spec exists, request/response shapes match; no schema drift |
| Auth coverage | Endpoints that require auth reject unauthenticated requests; if the project supports both web sessions and mobile JWT, both work |
| Project-specific landmines | Date handling, cache invalidation, timezone, or whatever the project's `CLAUDE.md` flags as a recurring failure mode — zero violations in the diff |
| Migration safety | Migration applies cleanly on a fresh DB and on a DB seeded with realistic data |
| Documentation | Per-project doc rules met (feature log entries, spec files, etc.) |
| UX walkthrough | No broken interactions, no console errors, no obvious dead-ends in the user flow |

**Tuning the evaluator (read this carefully):** Out of the box, the evaluator will be too generous. It will identify a real bug, then talk itself out of caring. It will test the happy path and skip edge cases. The fix is to coach skepticism into the prompt explicitly:

- "You are an adversarial QA reviewer. Your job is to find reasons this is not shippable, not to validate the work."
- "If you find a bug, file it. Do not decide it is acceptable. The generator will decide whether to fix or defer."
- "Test edge cases: empty inputs, very long inputs, unauthenticated requests, requests with malformed bodies, concurrent requests."
- "After each grading session, list three things you did not test. Default assumption: the generator stubbed something out."

When the evaluator's verdict diverges from a human reviewer's verdict, update the evaluator's prompt and re-run. This tuning loop is the most leveraged work in the harness.

## File-based handoff layout

Every harness run creates a working directory. Agents read each other's files; they do not share context.

```
harness-runs/<timestamp>-<feature-slug>/
├── prompt.txt              # Original 1-4 sentence input
├── research.md             # Researcher output — codebase context for Planner
├── spec.md                 # Planner output (reads research.md)
├── contract-slice-1.md     # Sprint contract for slice 1
├── contract-slice-2.md     # ...
├── generator-log.md        # Generator's progress notes, slice by slice
├── evaluator-report-1.md   # First eval pass — bugs filed
├── evaluator-report-2.md   # Re-eval after fixes
├── evaluator-report-N.md   # Continues until pass or stop condition
└── final-report.md         # Pass/fail summary, cost, duration
```

Files are append-only across iterations. The evaluator's report N+1 references issues from report N so the generator can see whether prior bugs are fixed or recurring.

## The Ralph loop

The Ralph loop is the wrapper that keeps the generator/evaluator cycle running until the work is actually done. Without it, the agent will stop the moment the build compiles. With it, the agent only stops when the evaluator passes every hard threshold or when a stop condition triggers.

**Pseudocode:**

```bash
iteration=0
max_iterations=10
while [[ $iteration -lt $max_iterations ]]; do
  iteration=$((iteration + 1))

  # Generator pass — read spec + latest evaluator report (if any), implement or fix
  run_generator \
    --spec harness-runs/$run/spec.md \
    --feedback harness-runs/$run/evaluator-report-$((iteration-1)).md

  # Evaluator pass — read spec + contract + generator's diff, grade against thresholds
  run_evaluator \
    --spec harness-runs/$run/spec.md \
    --report-out harness-runs/$run/evaluator-report-$iteration.md

  # Stop condition: clean pass
  if grep -q "^VERDICT: PASS" harness-runs/$run/evaluator-report-$iteration.md; then
    echo "Harness complete in $iteration iterations"
    break
  fi

  # Stop condition: regression — same bug filed twice in a row
  if same_bugs_as_previous harness-runs/$run/evaluator-report-$iteration.md; then
    echo "Generator stuck on the same bug — escalating to human"
    break
  fi
done
```

**Required stop conditions** — without these the loop runs forever or burns budget on a stuck agent:

1. **PASS verdict.** The evaluator's report must end with a single line `VERDICT: PASS` or `VERDICT: FAIL` so the loop can be parsed mechanically. Do not rely on natural-language interpretation.
2. **Iteration cap.** Default to 10. Most features should converge in 2–4 iterations. If you hit 10, something is wrong and a human needs to look.
3. **Stuck detection.** If iteration N's bug list is the same as iteration N-1's, the generator is not making progress. Stop and escalate. Do not keep paying for a loop that is not converging.
4. **Budget cap.** Hard cost ceiling per run (e.g. $50). The article reports $124–$200 for full-app builds; for a single feature on an existing codebase, $20–50 is a reasonable ceiling.
5. **Wall-clock cap.** A few hours, then stop and report.

**Ralph loop anti-patterns to avoid:**

- Do **not** loop on the planner. The planner runs once. If the spec is wrong, restart the whole run with a better prompt; do not re-plan inside the loop.
- Do **not** let the generator skip the evaluator. Even if it "knows" the work is done.
- Do **not** let the evaluator pass on partial criteria with hand-waving. Every hard threshold is binary.
- Do **not** re-spawn the planner every iteration. The spec is the contract; if it changes mid-run, the generator and evaluator are now grading against different documents.

## Sandbox requirements

The harness runs autonomously. That means the sandbox must be locked down before the loop starts, not after.

- **Database isolation.** The generator must point at an ephemeral database (Neon branch, Docker Postgres, SQLite copy) — never production, never shared dev. Inject the connection string at harness startup.
- **No deploys from the harness.** Final artifact is a feature branch, not a deploy. The harness opens a PR; a human merges.
- **Test credentials only.** OAuth, third-party API keys, anything sensitive — use test fixtures, never real production credentials.
- **Spending caps.** Per-run dollar ceiling and daily ceiling, both enforced before the call to the model, not after.
- **Network scoping.** If the codebase has an allowed-domain list (some Claude Code setups do), keep it tight. The harness should not need to fetch arbitrary URLs.

## Minimal vs. full configurations

Not every feature needs the full three-agent harness. Choose based on scope:

**Minimal (researcher → planner → generator → single-pass evaluator at the end).** Use for routine features that follow established patterns in the codebase: one migration, one route, one component. Fast and cheap. Skip the per-slice sprint contracts; the spec itself is the contract.

**Full (researcher → planner → per-slice generator/evaluator with sprint contracts → integration evaluator).** Use when the feature spans multiple files, crosses auth boundaries, requires schema changes across multiple tables, or touches a known landmine area (dates, caching, mobile auth). The per-slice grading is what catches issues before they compound across slices.

Note: The Researcher always runs, even in minimal config. It's cheap (read-only, no code generation) and prevents the most common failure mode — the Planner making wrong assumptions about existing code.

A small upfront classifier call can choose between the two: "Given this prompt and the project's feature log, is this routine or complex?"

## Anti-patterns

- **Self-evaluation.** A single agent grading its own output. Always wrong. Use a separate evaluator context.
- **Soft thresholds.** "Mostly works" or "looks good" are not pass criteria. Every threshold must be binary.
- **Shared context across agents.** If the generator and evaluator see the same conversation, the evaluator inherits the generator's optimism. Keep contexts separate.
- **Looping the planner.** Planning is a one-shot decision. Re-planning mid-run produces incoherent specs.
- **Evaluator that only reads code.** Code-reading evaluators miss runtime bugs. The evaluator must execute the application — Playwright, curl, DB queries.
- **Compaction instead of fresh context.** For long runs on older models, compaction preserves context-anxiety bias. Fresh context resets between iterations are cleaner.
- **Stopping at first build success.** A build that compiles is not a feature that works. The Ralph loop exists because of this exact failure.
- **Skipping the sprint contract.** Without an upfront contract, the evaluator and generator argue about what "done" meant. The contract is cheap; skipping it is expensive.
- **Planner reading raw source files.** The Planner should consume the research brief, not explore the codebase itself. Mixing exploration and planning in one context dilutes both.
- **Research brief that dumps full files.** The Researcher should summarize patterns and cite file paths, not paste entire files. The Planner needs to understand conventions, not read implementations.

## Re-examining the harness when models improve

The harness encodes assumptions about what the model cannot do solo. When a new model lands, those assumptions go stale. Re-examine each component:

- Does the planner still add value, or does the generator now spec its own work coherently?
- Does the per-slice sprint contract still catch issues, or can the generator handle larger slices?
- Does the evaluator catch real bugs, or is it just rubber-stamping?

Strip pieces that no longer earn their keep. Add pieces that capture new capability. The space of useful harnesses moves as models improve; it does not shrink.

## Quick reference: invoking the harness

When the user asks to "run the harness on X" or "build X with planner/generator/evaluator":

1. Create `harness-runs/<timestamp>-<slug>/` and write the user's prompt to `prompt.txt`.
2. Run the **Researcher** as a sub-agent (Explore type). Input: user prompt + CLAUDE.md. Output: `research.md`.
3. Run the **Planner** as a sub-agent. Input: user prompt + `research.md`. Output: `spec.md`. Stop and let the user review the spec if it materially affects scope; otherwise proceed.
4. Enter the Ralph loop:
   - Run the **generator** with the spec and (if iteration > 1) the previous evaluator report.
   - Run the **evaluator** with the spec and the generator's branch. Output ends with `VERDICT: PASS` or `VERDICT: FAIL`.
   - Check stop conditions (pass verdict, iteration cap, stuck detection, budget cap).
5. On exit, write `final-report.md` summarizing iterations, cost, duration, and the final verdict. Open a PR if and only if the verdict is PASS.
6. Hand off to the user with the PR link or the failure diagnosis.

The user should be able to walk away during step 4 and come back to either a green PR or a clear "here's why I'm stuck" report.
