# Explain finding format

Reusable per-finding presentation block. Used by `workflows/apply-mode.md` AP1 for consent and by `workflows/output-formats.md` when the user asks "explain finding N" during audit.

## Format

```
[<SEVERITY> · <RULE_CODE>] <anchor> at <file:line>

What I see: <literal trigger evidence — quote text or describe what's there>
Why it matters: <one-line from the rule's "Why it matters" snippet in principles/*>
If applied: <impact — words saved, viewports recovered, info loss yes/no>
```

## Field rules

- **What I see:** literal evidence the rule fires on. Quote actual page text where possible (`"01 · Cover · p.01"`). If structural, name the structure ("six sibling `Sheet N/05` divider sections").
- **Why it matters:** copy verbatim from the rule's `**Why it matters:**` snippet in the matching principles file. Do not improvise; consistency builds trust.
- **If applied:** concrete impact. Word count saved, viewport count change, whether information is lost.

## Severity tiers

- **CRITICAL** — C1, C2, C3, C4 violations on a primary section; or page exceeds editorial threshold by ≥ 50%.
- **HIGH** — C-rules on minor sections; cross-page X1/X2/X3; or threshold exceeded by < 50%.
- **MEDIUM** — secondary-check violations on a single section.
- **LOW** — secondary-check violations site-wide that don't materially harm the page's job.

## Consent prompt format

Used in apply mode after presenting the explain block:

```
Apply this cut? [y]es / [n]o / [s]kip / [w]hy more? / [a]pply all critical
```

`why more?` opens an expanded explanation: read the relevant `principles/*.md` rule definition in full, render the relevant section of the page in the browser overlay, and offer the choice again.

## `[w]hy more?` mandatory output

When the user picks `[w]hy more?` during apply consent, the controller MUST print all four of:

1. **Rule definition.** Copy the matching `## Rule X` block from the relevant `principles/*.md` file (heading + body + Why it matters) verbatim.
2. **Why this finding triggers the rule on this section.** Specific to the current section. State the trigger evidence: which characters of the section text matched, which selector hit, what threshold was exceeded. This goes beyond the "What I see" line in the explain block — it explains the rule-to-evidence mapping.
3. **Cross-references when applicable.** If the same pattern appears on other audited routes or in other sections, list them. The user benefits from knowing whether this is an isolated case or a repeated pattern.
4. **Re-prompt.** Print the same prompt that preceded `[w]hy more?` (with the same five letter options and any `(Recommended)` tag).

The four-part output is mandatory. Skipping (1) hides the rule. Skipping (2) leaves the user wondering why the rule fires HERE. Skipping (3) loses the systemic insight. Skipping (4) breaks the loop.

## Conversational refinement

The five letter options (`y/n/s/w/a`) are the canonical answers. Free text from the user opens a refinement branch.

### Example

Skill prints:

```
[CRITICAL · C2] aside.e2-index-card at home.blade.php:29

What I see: a "Studio at a glance" card with a stats grid (3 / 1 / 0 / EU) and an `<ol class="e2-masthead-list">` listing "01 · Cover · p.01" through "05 · Design partner · p.05".
Why it matters: borrowed metaphors (page numbers on a scroll page) imply functions that don't exist.
If applied: removes the entire card (88 words, ~520 px scroll).

Apply this cut? [y]es / [n]o / [s]kip / [w]hy more? / [a]pply all critical
```

User replies (free text):

> Regarding this — I want to cut just the bottom chapter list, keep the stats grid above it.

Skill response:

1. Narrow the anchor: `aside.e2-index-card` → `aside.e2-index-card ol.e2-masthead-list`.
2. Re-render the overlay with the narrower selector.
3. Re-print the explain block:

```
[CRITICAL · C2] aside.e2-index-card ol.e2-masthead-list at home.blade.php:40

What I see: an `<ol>` with five entries "01 · Cover · p.01" through "05 · Design partner · p.05".
Why it matters: borrowed metaphors (page numbers on a scroll page) imply functions that don't exist.
If applied: removes the chapter list (29 words, ~180 px). Stats grid above is preserved.

Apply this cut? [y]es / [n]o / [s]kip / [w]hy more? / [a]pply all critical
```

The user can now accept the refined version with `y`, refine further, or back out with `n`.
