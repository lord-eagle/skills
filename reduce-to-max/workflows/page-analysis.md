# Page analysis workflow

Runs once per target route after intent discovery.

## Step A1 — Detect stack (informational, never surfaced)

Use `Read` on these (whichever exist) to record the styling and framework idiom for use in Apply mode:

- `package.json` (`dependencies`, `devDependencies`)
- `tailwind.config.{js,ts}`, `postcss.config.{js,ts}`
- `astro.config.{js,ts,mjs}`, `next.config.*`, `vite.config.*`, `nuxt.config.*`

Record the idiom as one of: `tailwind`, `css-modules`, `plain-css`, `styled-components`, `unocss`, `unknown`. Apply mode uses it; the user does not see it.

## Step A2 — Section map

Run `scripts/extract-sections.js` on the route and parse the JSON. Each section has DOM anchor, words, ctas, rect, heading.

## Step A3 — File:line resolution

For each section, attempt to find the file:line that owns it:

1. If the section has a unique `id`, grep the repo for that id (`rg "id=[\"']<id>[\"']"`).
2. Else, grep for the heading text (longest unique substring of the heading, lowercased + escaped).
3. Else, grep for a unique snippet of the section's text.

The first match's path and line number are recorded. If multiple matches, record the most specific (smallest file or deepest path). If zero matches, record `null` and note "best-effort failed; section spans MDX/layout."

## Step A4 — Page metrics

Run `scripts/compute-metrics.js` on the route and parse the JSON.

## Step A5 — Per-section claim

For each section, the skill (the LLM at runtime) writes a one-sentence claim attempting to summarize the section. This is the hand-off into `comprehensibility-audit.md`. If the LLM cannot produce a claim, the section is flagged (Rule C1).

## Output of page analysis (per route)

```json
{
  "route": "/gaze",
  "stack": "astro+tailwind",
  "metrics": { "viewports": 5.5, "words": 1820, "words_above_fold": 87, "typeface_count": 3 },
  "sections": [
    { "anchor": "aside.e2-index-card", "file": "src/components/IndexCard.astro:1", "heading": null, "claim": null, "words": 28, "ctas": 0, "rect": { "y": 3247, "h": 465 } },
    { "anchor": "section#hero", "file": "src/pages/gaze.astro:42", "heading": "The gate to AI", "claim": "...", "words": 64, "ctas": 1, "rect": { "y": 0, "h": 720 } }
  ]
}
```
