# Comprehensibility audit workflow

Applies the rules in `principles/comprehensibility.md` (C1–C4) to every section produced by `page-analysis`.

## Step CA1 — Summarizability check (C1)

For each section, attempt to write a one-sentence claim. The claim must:

- Use specific nouns and verbs (no marketing adjectives).
- Reference a thing the reader can verify on the page.
- Fit in under 20 words.

If the claim cannot be written, flag the section as `C1: cannot summarize`. Recommendation: **cut**.

## Step CA2 — Medium-fit check (C2)

Inspect each section for borrowed-medium signals:
- Page numbers (`p.01`, `Page 1`, `01.A`) on a scroll page.
- Footnote markers (`¹`, `[1]`) without corresponding footnotes.
- Terminal prompts (`$`, `>`) where the line is not a real, copyable command.
- Magazine TOC structure (`01 · Title · p.01` × N) on a one-route page.
- Card-shuffle or deck metaphors with no shuffle interaction.

Flag matches as `C2: medium mismatch`. Recommendation: **cut**.

## Step CA3 — Takeaway check (C3)

For each section, ask: does the reader leave with at least one of (a) a fact they did not have, (b) a decision support they did not have, (c) a next step they could not see?

If none, flag as `C3: no takeaway`. Recommendation: **cut** or **merge into a stronger section**.

## Step CA4 — Decoration-as-content check (C4)

Inspect "stat strip" / "by the numbers" / "badge row" sections specifically. Each item must commit to a verifiable claim. Vague codes (`01.A`, `v0`, `EU` without "EU-hosted" or similar) are decoration. If most items in such a section are vague, flag as `C4: decoration as content`. Recommendation: **rewrite to commit** or **cut**.

## Output of comprehensibility audit

A list of findings, each:

```json
{
  "rule": "C1" | "C2" | "C3" | "C4",
  "anchor": "aside.e2-index-card",
  "file": "src/components/IndexCard.astro:1",
  "claim_attempt": null | "string",
  "recommendation": "cut" | "merge" | "rewrite",
  "rationale": "one-line reason"
}
```
