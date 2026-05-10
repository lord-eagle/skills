# Verify-apply workflow

Runs after `apply-mode.md` Step AP4 commits. Confirms that accepted findings actually disappeared from the live page and the source. Prevents apply-mode from reporting "applied: N" without measuring ground truth.

## Step VA1 — Re-scan each route

For every route audited in this apply session, re-run the relevant scripts:

```bash
dev-browser run scripts/scan-content.js     # detects C5, C6, F1, F2 patterns
dev-browser run scripts/compute-metrics.js  # detects TS1, CL1, DC1 thresholds
dev-browser run scripts/extract-sections.js # detects HI1 (cta count) thresholds
```

Update each script's `URL` constant to the route under verification (or use the stdin-pipe pattern from SKILL.md).

## Step VA2 — Compare per accepted finding

For every finding that was marked **accepted** in AP1:

1. Look up the finding's `rule` and `anchor`/`selector`.
2. Find the corresponding entry in the post-apply scan output:
   - `C5` → search `internal_leaks` for the same selector or substring of the original text.
   - `C6` → search `metaphor_hits` for the same selector.
   - `F1` → search `unlabeled_inputs` for the same selector.
   - `F2` → search `missing_required_indicators` for the same selector.
   - `C1`/`C2`/`C3`/`C4` → re-run extract-sections.js; verify the section anchor is gone (anchor disappeared = cut succeeded; anchor still present = regression).
   - `RA-merge`/`RA-cut` → verify the candidate section's anchor disappeared from the section map.
   - `TS1`/`CL1`/`DC1` → check the new metrics; verify the violated threshold now passes.
   - `HI1` → check the section's cta count is now ≤ 1.
   - Editorial `viewports`/`words_above_fold` → check the new metric is below threshold.

3. Classify:
   - **GONE** — the finding's pattern is no longer detected. Apply succeeded.
   - **REGRESSION** — the pattern is still present despite being accepted. Apply lied.
   - **PARTIAL** — the pattern is reduced but not eliminated (e.g., 4 of 6 sheet headers gone, 2 still there). Apply incomplete.

## Step VA3 — Halt-and-report on REGRESSION or PARTIAL

If any finding's status is REGRESSION or PARTIAL, **halt** before returning control to the user. Report:

```
verify-apply HALT — N findings did not apply cleanly:

[REGRESSION] C5 /admin/cms-products
  Accepted: yes (round 2)
  Expected: leak removed
  Actual:   still present at home.blade.php:61, home.blade.php:66
  Action:   open the file at the listed lines and remove manually, OR run apply again with strict file:line resolution

[PARTIAL] C6 sheet metaphor
  Accepted: yes (round 2)
  Expected: 6 occurrences cut
  Actual:   2 cut, 4 still in DOM (Sheet 01/05 ... Sheet 04/05)
  Action:   re-run apply with finer file:line targeting
```

Do not proceed to AP5. The user decides whether to:
- Manually fix the listed regressions, then mark verified.
- Run apply mode again on the regressions only.
- Accept the partial state and exit.

## Step VA4 — Success summary on clean verify

If every accepted finding is GONE, print a one-line summary:

```
verify-apply OK — all N accepted findings confirmed removed across <routes>.
```

Then proceed to AP5 (no push, no PR).

## Why this step exists

Before v0.6, apply-mode reported "applied: N" based on the controller's belief, not measured state. The session's controller could (and did) report applies that didn't change source. v0.6 makes apply mode honest: nothing is "applied" until a re-scan confirms it.
