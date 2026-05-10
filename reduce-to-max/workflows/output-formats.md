# Output formats workflow

Runs at the end of every audit, assembling findings into the user-visible output.

## Default — chat report

Markdown structure:

```
## reduce-to-max audit

**Mode:** Audit
**Routes:** /gaze
**Branch:** design-cleanup/2026-05-09 (or current)

### Intent
- Product: <one sentence, confirmed>
- /gaze purpose: <one sentence, confirmed>

### Metrics
- Viewports: 5.5  (threshold: ≤ 4)  ❗
- Sections: 7    (threshold: ≤ 5)   ❗
- Words above fold: 87  (threshold: ≤ 60)  ❗
- Time-to-CTA: section 6 (threshold: ≤ 2)  ❗

### Primary findings

**[CRITICAL · C2 medium mismatch] aside.e2-index-card — TOC with `p.01–p.05` on a scroll page**
- File: `src/components/IndexCard.astro:1`
- Recommendation: **CUT**. Page numbers do not exist on a scroll page.

**[CLUSTER · merge] Three sections restate the anonymization claim**
- Survivor: `section.sarah-demo` (`src/components/SarahDemo.tsx:1`)
- Cut/merge: `section.pipeline-anatomy`, `section.removed-content`
- Estimated words saved: ~480

### Cross-page findings (multi-route only)

(Identical structure as above, scoped per cross-page rule.)

### Secondary checks

- TS1 typeface count: 3 (threshold ≤ 2). File: `src/styles/typography.css:14`.
- DC1 decoration effects on hero: 5 (threshold ≤ 3). File: `src/components/Hero.astro:1`.

### What to do next

- Apply Mode would cut the TOC and merge the three anonymization sections into `SarahDemo.tsx`.
- Run `declutter /gaze and apply` to proceed (preflight will fire first).
```

A persistent file is **not** written by default. The user can pipe the chat report to a file or ask for one explicitly.

## Opt-in — browser overlay

Triggered by phrases like "show me", "with overlay", "visual mode" in the user's invocation.

The overlay is rendered by `scripts/overlay-render.js`, which injects a fixed stylesheet and absolute-positioned outline boxes over each flagged section. Colour code:

- Red — recommendation `cut`
- Yellow — recommendation `merge` or `shorten` or `rewrite`
- Green — section is fine; shown only on hover toggle

Each box carries a small label with the rule code (e.g., `C2`, `RA-merge`) and a short hint. Hovering shows the full finding text.

The overlay does not modify the page DOM beyond injecting one `<style>` and one `<div>` container; it does not navigate, scroll, or click for the user.

### Runtime invocation contract

Because the dev-browser sandbox cannot accept arbitrary CLI args, the runtime caller of the skill writes findings to `~/.dev-browser/tmp/overlay-findings.json` before invoking the script:

```bash
cp /tmp/findings.json ~/.dev-browser/tmp/overlay-findings.json
dev-browser run scripts/overlay-render.js
```

The script reads that fixed filename via the sandbox-allowed `readFile()` API.
