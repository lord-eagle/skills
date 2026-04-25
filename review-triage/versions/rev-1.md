---
name: review-triage
description: >-
  Triages PR review feedback into Must fix / Should fix / Nice to have / Nit buckets.
  Use when deciding what blocks merge versus what becomes follow-up issues.
  Bundles non-blocking findings into one GitHub issue per severity and places them in
  Artistfy project 2 via the GitHub CLI. Supports early-exit via a `review-triage:complete`
  marker comment on PRs whose head SHA has not changed.
  Do not use for automated dependency PR validation or merge automation.
---

# Review Triage

## When to Use This Skill

Use this skill when asked to:
- Triage PR review comments
- Turn review feedback into blockers versus follow-up issues
- Summarize review feedback for CI or MVP discussions
- Decide which review findings must be fixed now versus tracked later

Do not use this skill for:
- Automated dependency PR testing or merging
- Full code review from scratch without existing feedback
- General bug backlog triage outside the context of a PR review

## Core Rules

1. `Must fix` items are blockers and must be fixed before merge.
2. `Should fix`, `Nice to have`, and `Nit` items become bundled follow-up issues by severity when possible.
3. Never create a follow-up issue for a `Must fix`.
4. Deduplicate overlapping comments before classifying or creating issues.
5. If tooling for issue creation is unavailable, output issue drafts instead of claiming issues were created.
6. For this repository, use the GitHub CLI for follow-up issue creation and project placement when available.
7. Place created follow-up issues into the Artistfy project at `https://github.com/orgs/Artistfy/projects/2`, preferring `Todo` or `Next` instead of backlog.
8. Default to one bundled follow-up issue per non-blocking severity bucket, not one issue per finding.
9. Use an adaptive review depth: triage existing feedback when the PR is unchanged since its latest substantive review, otherwise review the unreviewed changes first.
10. The skill may exit early only when a valid `review-triage` marker comment matches the current PR head SHA.
11. Large or high-risk PRs require deep review unless a valid marker shows they were already triaged via deep review for the current head SHA.
12. Always state review confidence in the output.

## Severity Definitions

### Must Fix

Use `Must fix` only when the feedback identifies a concrete blocker such as:
- broken behavior
- incorrect logic
- regression risk
- data loss or integrity risk
- security or privacy issue
- CI failure risk that blocks the team's current CI goals
- maintainability risk severe enough to block MVP delivery

When uncertain, do **not** escalate to `Must fix` without a concrete technical reason.

Use `Must fix` only when you can clearly explain:
- what breaks or is at risk
- why it matters before merge
- why deferring it to a follow-up issue would be unsafe

Do not mark something as `Must fix` only because:
- it is a good idea
- it would make the code cleaner
- it aligns with a preference
- it might matter eventually, but no immediate risk is shown

### Should Fix

Use `Should fix` when the change is not a blocker for merge, but materially improves:
- reliability
- test coverage or testability
- CI stability
- operational safety
- maintainability tied to near-term MVP work

### Nice To Have

Use `Nice to have` for meaningful improvements that add value but are not urgent.

### Nit

Use `Nit` for low-impact polish only:
- wording
- naming
- formatting
- minor readability or style preferences

If a comment is mostly subjective and has no concrete product or engineering risk, prefer `Nit`.

## Priority Mapping

Priority is expressed as a GitHub **issue label**, not a project field — the
Artistfy Dashboard project (project 2) does not expose a Priority field, so
attempting to set one there will fail silently.

| Review Severity | Priority Label |
|-----------------|----------------|
| `Should fix` | `priority:high` |
| `Nice to have` | `priority:medium` |
| `Nit` | `priority:low` |

Apply the label at issue-creation time with `gh issue create --label priority:high`.

Use this default project lane (Status) mapping for project 2:

| Review Severity | Default Project Lane |
|-----------------|----------------------|
| `Should fix` | `Next` |
| `Nice to have` | `Todo` |
| `Nit` | `Todo` |

## Workflow

### Step 1: Check Review State

Before triaging, determine whether this PR needs a fresh code review pass.

First, resolve the PR's current head SHA — it is the anchor for marker validity:

```bash
gh pr view <pr-number> --json headRefOid -q .headRefOid
```

Then check whether the PR already has a valid `review-triage` marker comment for that head SHA.

If a valid marker exists and the PR head SHA has not changed since that marker:
- the prior triage is still current
- the skill may exit early only if the marker is acceptable for the PR risk level
- do not repeat the review or recreate follow-up issues unless the user explicitly asks for a refresh

Prefer the fast path when:
- the PR already has substantive review feedback
- there are no new commits since the latest substantive review
- the existing feedback appears relevant and complete enough to triage

Perform a deeper review first when any of these are true:
- there are new commits after the latest review
- there is little or no existing review feedback
- the prior feedback is only approval or otherwise not substantive
- the existing feedback is ambiguous, inconsistent, or obviously incomplete
- the diff is large or touches higher-risk areas

Treat a PR as large when either of these is true:
- more than 25 changed files
- more than 800 changed lines

Treat these as higher-risk areas:
- authentication or authorization
- payments or billing
- CI or deployment
- database migrations or destructive data changes
- permissions, privacy, or security-sensitive flows
- infrastructure or configuration changes that can break delivery

### Triage Marker

Use an explicit marker comment instead of trying to infer validity from ordinary comments.

Recommended marker format:

```md
<!-- review-triage:complete sha=<head-sha> mode=<fast-triage|deep-review> -->
```

Optional human-readable text may follow, for example:

```md
<!-- review-triage:complete sha=<head-sha> mode=deep-review -->
PR triage still valid.
```

Only treat a marker as valid when:
- it matches the exact `review-triage:complete` format
- the SHA matches the current PR head SHA
- the mode is present and valid
- it appears to represent a completed triage result

For large or high-risk PRs:
- only `mode=deep-review` may trigger early exit
- `mode=fast-triage` is not enough

Do not early-exit based on:
- the latest ordinary comment
- vague wording such as "looks good" or "still valid"
- a marker with a stale SHA
- a marker from an incomplete run

### Step 2: Gather Findings

If the fast path applies:
- gather the existing review feedback from PR comments, reviews, or a pasted summary

If a deeper review is required:
- inspect the PR diff against its base branch
- review the changed files directly
- identify findings from the code before triaging
- merge those findings with any existing review feedback

For self-review, do not assume prior approvals mean the PR is safe. If the trigger conditions require review, review it first.

### Step 3: Normalize and Deduplicate

For each review point, capture:
- concise summary
- file and line reference when available
- reasoning or risk
- whether it duplicates another comment

If the feedback is ambiguous, ask for clarification only when the classification would otherwise be misleading.

Before classifying:
- merge repeated comments about the same root problem
- separate compound comments into distinct issues when they describe different actions
- drop comments that are already resolved or already tracked, if that is clear from the context

### Step 4: Classify

Classify each unique review point into exactly one bucket:
- `Must fix`
- `Should fix`
- `Nice to have`
- `Nit`

Bias toward the lowest severity that is still defensible. A concrete risk is required to justify escalation.

### Step 5: Decide Merge Impact

- Any `Must fix` means the PR is blocked until those items are addressed.
- `Should fix`, `Nice to have`, and `Nit` do not block merge by default.
- If there are no `Must fix` items, say that explicitly.

### Step 6: Create Follow-Up Issues When Possible

If the environment supports issue creation for the repository:
- use `gh`, not browser-only flows or non-portable MCP-specific tooling
- create at most one bundled follow-up issue per non-blocking severity bucket
- include PR number and link when available
- use concrete, action-oriented titles
- assign priority from the mapping above
- add the created issue to the Artistfy project `2`
- place it into `Todo` or `Next` when possible instead of leaving it in backlog only

If issue creation is not available:
- produce issue drafts in the same structure
- state clearly that they were not created

Never pretend an issue was created if the tool or repository access was not verified.

Bundle findings like this:
- one `Should fix` issue containing all deduplicated `Should fix` findings
- one `Nice to have` issue containing all deduplicated `Nice to have` findings
- one `Nit` issue containing all deduplicated `Nit` findings

Only split a severity bucket into multiple issues when:
- the findings are obviously unrelated
- the bucket is too large to be actionable as one issue
- the user explicitly asks for more granular issues

### Step 7: Post Completion Marker

After a successful triage run, post the marker comment on the PR so future
runs can early-exit while the head SHA is unchanged. Without this step, early
exit can never trigger on subsequent runs.

```bash
gh pr comment <pr-number> --body '<!-- review-triage:complete sha=<head-sha> mode=<fast-triage|deep-review> -->
PR triage complete. See summary above.'
```

Use `mode=deep-review` only when the run actually inspected the diff.
Use `mode=fast-triage` when the run relied on existing review feedback without a fresh code pass.

Skip this step if:
- a valid marker for the current head SHA already exists
- issue creation failed and the run produced drafts only
- the user asked for a preview without posting

## Issue Creation Rules

Before creating a follow-up issue:
- verify `gh auth status` succeeds
- verify the token has the `project` scope or can access project operations
- verify the repository context is correct
- check for obvious duplicates in existing issue references when available
- skip issue creation for feedback that is already tracked

When creating the issue, apply the priority label from the mapping:
`gh issue create --label priority:high` (or `priority:medium` / `priority:low`).

For this repository's project placement:
- target `https://github.com/orgs/Artistfy/projects/2` (Artistfy Dashboard)
- use `gh project field-list 2 --owner Artistfy --format json` to find the `Status` field and option IDs
- use `gh project item-add 2 --owner Artistfy --url <issue-url>` to add the created issue to the project
- use `gh project item-edit --id <item-id> --project-id <project-id> --field-id <status-field-id> --single-select-option-id <option-id>` to set the lane
- use the default lane mapping unless the user says otherwise: `Should fix` -> `Next`, `Nice to have` -> `Todo`, `Nit` -> `Todo`
- project 2 has no `Priority` field; rely on the issue label instead
- if the project or lane cannot be verified, still create the issue when possible but state that placement did not happen
- if `gh` auth or project access fails, output drafts and note the missing capability instead of claiming success

Each follow-up issue should include:
- title
- severity
- priority
- source PR number or link
- short bucket summary
- checklist of included findings
- why the bucket matters
- suggested implementation scope

## Output Format

Use this structure:

```md
## Review Triage

### Confidence
- High | Medium | Medium-low

### Review Mode
- Reused valid marker | Fast triage | Deep review

### Must Fixes
- [path/to/file:line] Summary
  Reason: concrete blocker
  Action: required change before merge

### Merge Decision
- Blocked by must fixes
```

If there are no blockers:

```md
### Confidence
- High | Medium | Medium-low

### Review Mode
- Reused valid marker | Fast triage | Deep review

### Must Fixes
- None

### Merge Decision
- No must fixes identified
```

For follow-up work:

```md
### Follow-Up Issues Created
- #123 Title (`Should fix`, priority: `high`)
  Why now: ...
  Includes:
  - first finding
  - second finding
  Project placement: `Next`
```

Or, when creation is unavailable:

```md
### Follow-Up Issue Drafts
- Title: ...
  Severity: `Nice to have`
  Priority: `medium`
  Source PR: ...
  Summary: ...
  Why now: ...
  Includes:
  - first finding
  - second finding
  Why it matters: ...
  Suggested scope: ...
  Suggested project placement: `Todo`
```

## Review Heuristics

- Do not convert taste-only comments into blockers.
- Do not create multiple issues for the same root cause.
- Prefer one bundled issue per severity by default.
- Split a bucket only when bundling would make the issue too vague or too large to act on.
- Use early exit only when the marker comment and current head SHA match exactly.
- Never use the latest generic PR comment as the early-exit signal.
- For large or high-risk PRs, require prior deep-review evidence before early exit.
- Prefer the fast path only when the PR is actually unchanged since its latest substantive review.
- If new commits landed after review, do not rely on stale review feedback alone.
- If a PR touches high-risk areas, bias toward reviewing the code before triaging.
- Use `Confidence: high` only for a valid current marker or a clearly complete deep review.
- Use `Confidence: medium` for unchanged substantive review feedback that was triaged without new code review.
- Use `Confidence: medium-low` when the result is based on partial sampling or when the PR is large and review coverage is limited.
- If a finding is specific to CI or MVP discussions, mention that explicitly in the reasoning.
- If a comment could block merge only under a specific assumption, state the assumption.
- For follow-up work, prefer visibility over perfect organization. If the right lane is unclear, say so explicitly rather than silently dropping the issue into backlog.

## GitHub CLI Notes

Use the GitHub CLI for private repository follow-up handling.

Typical sequence:

```bash
gh auth status
gh pr view <pr-number> --json headRefOid,comments,commits,reviews
gh issue create --repo <owner/repo> --title "..." --body "..." --label priority:high
gh project field-list 2 --owner Artistfy --format json
gh project item-add 2 --owner Artistfy --url <issue-url>
gh project item-edit --id <item-id> --project-id <project-id> --field-id <status-field-id> --single-select-option-id <option-id>
```

If `gh auth status` fails or the token is missing `project` access, do not attempt partial project automation. Produce follow-up issue drafts instead.

## Example Invocation

Use this skill when the user says things like:
- "Triage this PR feedback"
- "Split these review comments into blockers and follow-ups"
- "Turn this review into must-fix versus issue backlog"
- "Create follow-up issues for non-blocking PR feedback"

## Worked Example

Given these four review comments on PR #412 (hypothetical billing change):

1. *"The Stripe webhook handler throws if `stripe_id` is null — this will 500 in
   production whenever a legacy user hits it."* — `app/Http/Controllers/StripeWebhook.php:47`
2. *"We're instantiating `BillingService` inside the loop; please hoist it
   above for readability."* — `app/Jobs/BackfillInvoices.php:22`
3. *"Test file has no assertion on the `amount_cents` field — we'd miss a
   rounding regression."* — `tests/Feature/InvoiceTest.php:18`
4. *"Variable named `inv` could be `invoice` for consistency with the rest
   of the file."* — `app/Services/InvoiceService.php:80`

Expected triaged output:

```md
## Review Triage

### Confidence
- High

### Review Mode
- Fast triage

### Must Fixes
- [app/Http/Controllers/StripeWebhook.php:47] Webhook 500s on null `stripe_id`
  Reason: concrete regression risk for legacy users; production impact, not a taste call
  Action: guard the null case and return a 2xx with a logged skip

### Merge Decision
- Blocked by 1 must fix

### Follow-Up Issue Drafts
- Title: "[#412 follow-up] Reliability polish from billing review"
  Severity: `Should fix`
  Priority label: `priority:high`
  Source PR: #412
  Summary: add assertion on invoice `amount_cents` to catch rounding regressions
  Includes:
  - tests/Feature/InvoiceTest.php:18 — assert on `amount_cents`
  Suggested project placement: `Next`

- Title: "[#412 follow-up] Minor polish from billing review"
  Severity: `Nit`
  Priority label: `priority:low`
  Source PR: #412
  Summary: consistency and loop hoisting nits
  Includes:
  - app/Jobs/BackfillInvoices.php:22 — hoist `BillingService` above loop
  - app/Services/InvoiceService.php:80 — rename `inv` → `invoice`
  Suggested project placement: `Todo`
```

Notes on the triage:
- Comment 1 is a concrete production-impact bug → `Must fix`, stays in the PR.
- Comment 3 is a real test-coverage gap with regression risk but does not block
  the merge → `Should fix`, bundled alone (its own issue).
- Comments 2 and 4 are taste / minor polish → `Nit`, bundled into one issue.
- Nothing here justifies `Nice to have`, so that bucket is omitted.
