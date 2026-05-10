# Apply mode workflow

Active only when preflight resolved `mode: apply`. Runs after the audit and the user's explicit acceptance of each finding.

## Step AP1 — Confirm acceptance per finding (consent-with-context)

This step is **strict and sequential**. The controller MUST follow it as written.

## Step AP1.0 — Entry to apply mode

Before entering the per-finding loop, the controller MUST NOT present a menu of pre-loop options that includes anything that skips, batches, or bypasses the loop. Specifically:

### Forbidden pre-loop options (never offer these)

- "Apply all CRITICAL + HIGH (skip per-finding loop)"
- "Apply all and walk later"
- "Batch apply, no questions"
- Any wording that lets the user accept multiple findings before seeing them one at a time.
- "Apply this round" / "Apply set" / "Apply this batch" / "Round X / Y — pick which to apply"
- Any per-round, per-batch, or per-pass framing that presents multiple findings as checkboxes for batch acceptance, including across re-audit iterations.
- Any prompt that begins with "Which to apply" plural — the loop is always one finding at a time.

### What about iterative re-audits?

When the user runs apply mode after a previous apply (round 2 or later against the same routes), each round still walks per-finding. The skill MUST NOT collapse multi-round runs into a single "apply this round" multi-select. Each round's findings list is presented one finding at a time, exactly like round 1.

The user can still hit `[a]pply all critical` inside the loop on the first finding — that bulk shortcut stays. But the entry to round N is the same as the entry to round 1: "Apply mode walks each finding one at a time. Ready to start?"

### The only allowed pre-loop framing

State plainly:

> Apply mode walks each finding one at a time. Critical findings can be batch-accepted with `a` once you're inside the loop. Ready to start?

Then start the loop. Do not offer a menu. The single in-loop shortcut `[a]pply all critical` is the only batch acceleration available; it is not exposed as a pre-loop option.

### If the user explicitly asks "can I just apply all critical without seeing each one?"

Answer: "Yes — start the loop, hit `a` on the first finding. The skill will auto-accept all CRITICAL findings and continue with HIGH/MEDIUM/LOW per-finding."

This satisfies the user's batch desire while preserving the per-finding contract.

### Forbidden patterns

The controller MUST NOT:

1. Build a bulk multi-select UI (checkbox lists like "[ ] G1 cut X, [ ] G2 merge Y") presenting many findings at once for batch selection.
2. Ask "which findings to apply?" as a single combined question.
3. Render multiple overlays simultaneously during apply consent.
4. Apply edits without first walking the user through each finding individually.

The bulk shortcut `[a]pply all critical` (described below) is the only exception, and it still uses the per-finding loop — it just auto-answers `y` for findings tagged CRITICAL.

### Required loop

Loop over findings in priority order (CRITICAL → HIGH → MEDIUM → LOW). For each finding:

1. **Navigate the browser to the finding's canonical route.** Determine the canonical route as follows:
   - Single-route finding: that route.
   - Multi-route finding (e.g., a pattern that recurs across `/`, `/gaze`, `/trust`): pick the route whose **page purpose** most directly carries the finding. If equal, pick the route with the most occurrences. Annotate the explain block's "What I see" line: `<canonical route> shows the pattern; same on <other routes>`.

   The controller MUST navigate. Skipping navigation is forbidden.

2. **Render visual context. This step is mandatory and cannot be skipped.** Write a single-finding JSON to `~/.dev-browser/tmp/overlay-findings.json` with a `route` field set to the canonical route. Run `dev-browser run scripts/overlay-render.js`. Confirm the script reports `{"ok":true,"applied":N}` where `N >= 1`.

   The controller MUST NOT print "no live overlay render" or any equivalent text that signals overlay was skipped. If the overlay-render.js call fails (script error, browser unreachable), the controller halts AP1 and reports the error to the user; it does not fall through to text-only.

   Single-finding JSON shape:

   ```json
   [
     {
       "route": "http://127.0.0.1:8011/gaze",
       "anchor": "<css-selector>",
       "level": "cut|merge|fine",
       "code": "<rule>",
       "hint": "<short>"
     }
   ]
   ```

   For multi-route findings, the `anchor` selector is the one that resolves on the canonical route. The other routes are mentioned in the explain block text but not in the overlay.

3. **Print the explain block** (format defined in `workflows/explain-finding.md`):

   ```
   [CRITICAL · C2] aside.e2-index-card at resources/views/marketing/gaze.blade.php:31

   What I see: an `<ol class="e2-masthead-list">` with entries "01 · Cover · p.01" through "06 · Design partner · p.06".
   Why it matters: borrowed metaphors (page numbers on a scroll page) imply functions that don't exist. Readers spend cycles checking what they can do; they get nothing back.
   If applied: removes 36 words. No information loss. Saves ~488 px scroll depth.
   ```

   The Why-it-matters line MUST be copied verbatim from the matching `principles/*.md` rule's `**Why it matters:**` snippet. The controller does not improvise this line.

4. **Prompt with these exact options.** Tag one option `(Recommended)` when the finding is unambiguous; otherwise no tag.

   ```
   Apply this cut? [y]es / [n]o / [s]kip / [w]hy more? / [a]pply all critical
   ```

   ### When to mark `[y]es (Recommended)`

   Mark `[y]es (Recommended)` when **all three** of these are true:

   1. The finding is **CRITICAL**.
   2. The applied recommendation is **cut** or **rewrite-to-canonical** (not a judgment-call merge).
   3. The "If applied" line says **no information loss** OR **only dead/duplicate content removed**.

   Concrete examples that MUST be tagged:

   - C2 medium mismatch with cut recommendation, no info loss (the canonical case).
   - C5 internal-language leak with cut recommendation (admin URLs, dev TODOs on a public page).
   - INTENT_DRIFT with cut-dead-code or rewrite-to-canonical recommendation (stale brand strings, unused imports, orphaned files).
   - C4 decoration-as-content with cut of the decoration only (not the surrounding stats).

   The controller does not need permission to mark these. They are not borderline.

   Conversely, do **not** tag:

   - HIGH or MEDIUM findings (default to no recommendation).
   - Any finding whose recommendation is **merge** (the merge target is a judgment call).
   - Any finding whose "If applied" mentions copy rewriting that requires the user's voice.

   The controller MUST mark exactly one option per prompt unless no condition is met. Failing to mark when the three conditions are met is a spec violation; the controller treats this as a self-check failure and re-prompts after marking.

   These three together = the option is `(Recommended)`. Render the prompt as:

   ```
   Apply this cut? [y]es (Recommended) / [n]o / [s]kip / [w]hy more? / [a]pply all critical
   ```

   ### When to mark `[s]kip (Recommended)`

   - The finding is LOW or MEDIUM.
   - The recommendation is **rewrite** with a non-trivial copy change.
   - The user has not yet confirmed the page intent for this section.

   These together = `[s]kip (Recommended)` — the user should defer until they have edited copy ready, not let the skill guess.

   ### Otherwise

   No `(Recommended)` tag. The decision is genuinely a judgement call.

   The controller MUST NOT mark more than one option as `(Recommended)` per prompt.

   No additional menu items. No checkbox list of other findings. The user is voting on the single finding currently highlighted.

5. **Branch on the answer:**
   - `y` → mark accepted; continue to next finding.
   - `n` → mark declined; continue.
   - `s` → mark skipped; continue.
   - `w` → read the relevant `principles/*.md` rule definition in full, print it, ask the prompt again.
   - `a` → mark all remaining CRITICAL findings as accepted in bulk; print one-line confirmation per finding; the loop still walks HIGH/MEDIUM/LOW per-finding unless the user invokes `a` again. The bulk shortcut still respects the per-finding navigation and overlay render.

### Conversational refinement (allowed and encouraged)

If the user replies with free text instead of one of the five letter options — for example, "Regarding G1, I would love to cut just the bottom section, keep the stats" — the controller:

1. Parses the user's intent against the current finding.
2. Updates the finding's anchor/scope to match (e.g., narrowing `aside.e2-index-card` → `aside.e2-index-card ol.e2-masthead-list`).
3. Re-runs step 2 (re-renders the overlay) so the user sees the new scope.
4. Re-prints the explain block with the updated `What I see` and `If applied` fields.
5. Returns to step 4 (prompt) with the refined finding.

This is the only legitimate "free text" branch. The five letter options remain the canonical answers.

### After the loop

AP2 applies edits per accepted finding. Declined and skipped findings are dropped silently.

## Step AP2 — Edit per accepted finding

For each accepted finding:

- **Resolve the offending text via grep before applying.** The recorded `file:line` is a hint, not a guarantee. The controller MUST run `rg --line-number --no-heading <pattern> <file>` (or `grep -n`) where `<pattern>` is a unique substring of the offending text from the explain block's "What I see" line.
  - **Exactly one match** → proceed; the file:line is correct, edit there.
  - **Zero matches** → the file may have changed since audit. Refuse to apply this finding. Re-run the relevant audit script (scan-content.js, extract-sections.js) and ask the user to re-confirm.
  - **Multiple matches** → ambiguous edit target. Refuse to apply. Print all matches with line numbers and ask the user which one to act on, or to skip the finding.
- After resolution, use `Read` on the file at the confirmed line and continue with the recommendation (CUT / MERGE / SHORTEN / REWRITE).
- Apply the recommended change in the **stack idiom recorded in page-analysis**:
  - **CUT**: remove the section's element + its component import + any orphaned references the grep finds.
  - **MERGE**: move the candidate's distinguishing content into the survivor's component, preserving structure; remove the candidate; remove orphaned imports.
  - **SHORTEN**: remove paragraphs / list items inside the section per the recommendation.
  - **REWRITE**: replace decorative codes with the user-confirmed claim text. The skill never writes new claims — it inserts the text the user supplied at confirmation time.
- Use `Edit` (preferred) or `Write` only when a full rewrite is needed.

The skill **never**:

- Introduces a new dependency.
- Migrates between styling idioms (Tailwind ↔ CSS modules, etc.).
- Touches images, illustrations, or media files.
- Modifies build configs, package versions, or CI.

## Step AP3 — Validate the diff

After all accepted findings are applied:

```bash
git -C "$REPO" status
git -C "$REPO" diff --stat
git -C "$REPO" diff
```

Surface the `--stat` summary to the user and offer to show full `diff` on request.

## Step AP4 — Commit per route

One commit per route audited, with a body listing each accepted finding:

```bash
git -C "$REPO" add <changed-files>
git -C "$REPO" commit -m "$(cat <<'EOF'
chore(<route>): reduce-to-max — cut TOC, merge anonymization sections

- Cut aside.e2-index-card (C2 medium mismatch — page numbers on scroll page)
- Merge PipelineAnatomy + RemovedContent into SarahDemo (RA-merge — same claim)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- After all per-route commits land, run `workflows/verify-apply.md` against every route in the run. If verify-apply HALTs (regression or partial), do not proceed to AP5; surface the halt report to the user and wait for instruction. If verify-apply succeeds, proceed to AP5.

## Step AP5 — No push, no PR

The skill stops here. Pushing and PR creation are explicitly out of scope and require a separate user instruction.
