# Expected findings — /gaze (single-route Audit)

## Trigger

User invokes: **"declutter /gaze"** with the dev server running.

## Mode

Audit (no edits, no overlay).

## Required findings

The chat report MUST contain each of the following. Equivalent wording is fine; the rule code or DOM anchor is the load-bearing match.

1. **C2 medium mismatch — TOC card** anchored at `aside.e2-index-card` (the `01·Cover · p.01` through `06·Design partner · p.06` pseudo-magazine TOC). Recommendation: **cut**.

2. **C4 decoration as content — stat strip** with codes like `01.A`, `0`, `EU`. Recommendation: **rewrite to commit to a claim** or **cut**.

3. **Redundancy cluster — anonymization claim** spanning at least two of: the "Sarah" demo, the "top to bottom" anatomy section, and the "Removed content" section. Survivor expected: the demo (the section with concrete before/after content). Recommendation: **merge** or **cut** for non-survivors.

4. **Editorial — page exceeds viewport budget**: the report must call out total scroll height ≥ 4 viewports.

5. **Editorial — sections per page**: the report must call out section count > 5.

## Acceptable extra findings

The skill is allowed (and encouraged) to surface secondary-check findings such as `TS1` (typeface count) or `DC1` (decoration count) when violations exist. They do not count toward pass/fail.

## Failure conditions

Any of:
- The TOC card finding is missing or downgraded below `cut`.
- No redundancy cluster is detected for the anonymization claim.
- Viewport-budget or section-count metrics are not reported at all.
