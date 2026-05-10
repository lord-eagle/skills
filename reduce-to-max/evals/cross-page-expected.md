# Expected findings — / and /gaze (multi-route Audit)

## Trigger

User invokes: **"declutter / and /gaze"** with the dev server running.

## Mode

Audit, multi-route.

## Required findings

1. **X1 duplication — stats strip on both routes**. The strip with version, count, retention, region appears on both `/` and `/gaze`. Recommendation: keep on `/` (positioning), cut from `/gaze`.

2. **X1 duplication — anonymization claim** stated at the page level on both routes (separate from the section-level cluster on `/gaze` alone). Recommendation: keep on `/gaze`, link from `/`.

3. **X3 wording drift** check applied to at least the brand line and the trust framing. Output is either "no drift" or a specific drift finding with both variants and a canonical recommendation.

4. Per-route section findings from `gaze-page-expected.md` and `landing-page-expected.md` are still required.

## Failure conditions

- No cross-page section in the report at all.
- The stats-strip duplication is not detected.
- The skill recommends cutting the open-core family list from `/` (it belongs on landing per Rule X2).
