# Expected findings — / (single-route Audit)

## Trigger

User invokes: **"declutter /"** with the dev server running.

## Mode

Audit.

## Required findings

1. **Editorial — page-level metrics reported**. Sections, words, viewports must all appear in the report.

2. **Open-core family list section presence**. Detected and summarized; if present, it must NOT be flagged as redundant against `/gaze` content (the family list is landing-scope per Rule X2).

3. **Stat strip evaluation (C4)**. The skill must either commit-or-cut the landing's stat strip if its items are vague codes; if its items are concrete, no finding required.

4. **Trust posture / no-certification-theater section**. If present on landing, the skill must mark it as landing-scope OK; if the same section is also on `/gaze`, that's a cross-page finding (covered in `cross-page-expected.md`, not here).

## Failure conditions

- Page-level metrics omitted entirely.
- Open-core family list misclassified as redundant against `/gaze` (it belongs on landing per Rule X2).
