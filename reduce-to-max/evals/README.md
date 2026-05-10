# Evals

The skill is graded against the `gaze-website` repo as a fixture.

## Running an eval

1. Start the `gaze-website` dev server (typically `npm run dev` in that repo). Confirm `http://127.0.0.1:8011/gaze` and `http://127.0.0.1:8011/` respond.
2. In a fresh Claude Code session in the `gaze-website` repo, invoke the trigger described in each `*-expected.md` file.
3. Compare the chat report the skill produces against the "Required findings" section of the matching `*-expected.md`.

## Pass/fail rule

An eval **passes** when every required finding in the corresponding `*-expected.md` appears in the skill's report (matching anchor or matching rule code is sufficient; wording need not match).

An eval **fails** when one or more required findings are missing. The action is to fix the workflow or principle responsible and rerun, not to weaken the eval.

## What evals do not cover

- Apply-mode edits — Apply is gated behind explicit user consent and not part of the automated pass/fail.
- Subjective ranking of which "merge survivor" the skill picks — only that the cluster is detected.
