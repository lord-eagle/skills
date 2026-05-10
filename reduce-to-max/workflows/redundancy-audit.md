# Redundancy audit workflow

Runs after comprehensibility. Operates on the per-section claim sentences produced earlier.

## Step RA1 — Cluster claims

Group sections whose one-sentence claims reduce to the same idea, ignoring framing, examples, or wording. Use semantic similarity, not string similarity.

A cluster is any set of two or more sections with the same underlying claim. Examples on `/gaze`:

- "we anonymize prompts safely; here is how"
  - Section 2 ("Let Sarah talk to AI")
  - Section 3 ("The gaze: top to bottom")
  - Section 4 ("Removed content")

## Step RA2 — Score cluster cost

For each cluster, score:

- **Strongest survivor:** the section with the highest "demo density" — concrete example, working code, before/after diff. The other sections in the cluster are candidates for cut or merge.
- **Total words to be saved:** sum of words from candidates.
- **CTA loss risk:** if any candidate carries the page's only CTA, demote the recommendation from "cut" to "merge into survivor."

## Step RA3 — Recommend per cluster

Issue a single recommendation per cluster:

- **CUT** — drop the candidate(s) entirely; the survivor stands.
- **MERGE** — fold candidate content into the survivor.
- **SHORTEN** — when the cluster is one section restated within itself; cut paragraphs but keep the section.
- **KEEP_ALL** — only when each section advances the claim in a materially different way (rare; requires explicit rationale).

## Output of redundancy audit

```json
{
  "clusters": [
    {
      "claim": "we anonymize prompts safely; here is how",
      "survivor": { "anchor": "section.sarah-demo", "file": "src/components/SarahDemo.tsx:1" },
      "candidates": [
        { "anchor": "section.pipeline-anatomy", "file": "src/components/PipelineAnatomy.tsx:1" },
        { "anchor": "section.removed-content", "file": "src/components/RemovedContent.tsx:1" }
      ],
      "recommendation": "merge",
      "words_saved_estimate": 480,
      "rationale": "Three sections restate the anonymization claim; the demo carries the strongest evidence."
    }
  ]
}
```
