# Secondary checks audit workflow

Runs after editorial + comprehensibility + redundancy + cross-page IA. Closes the loop on rules that previously lived in `principles/secondary-checks.md` and `principles/comprehensibility.md` (C5, C6) without an audit code path.

## Step SC1 — Run scan-content.js per route

For each target route, run `dev-browser run scripts/scan-content.js` with the route's URL. Parse the JSON output.

The script returns four arrays:
- `metaphor_hits` → C6 candidates
- `internal_leaks` → C5 candidates
- `unlabeled_inputs` → F1 candidates
- `missing_required_indicators` → F2 candidates

## Step SC2 — Apply C5 (internal-language leak)

For each entry in `internal_leaks`, emit a finding:

```json
{
  "rule": "C5",
  "severity": "MEDIUM",
  "anchor": "<selector from the entry>",
  "file": "<resolved via the same file:line strategy as page-analysis>",
  "claim_attempt": "internal/admin language on a public page",
  "recommendation": "cut" | "rewrite",
  "rationale": "internal reference visible on a public marketing page; readers can't act on it"
}
```

CUT if the line is pure instruction ("Toggle visibility from..."). REWRITE if the line carries information but uses internal naming.

## Step SC3 — Apply C6 (metaphor recurrence)

For each entry in `metaphor_hits`, emit a finding. Use HIGH severity if the same metaphor was already cut elsewhere on this run (residual cleanup); MEDIUM otherwise.

```json
{
  "rule": "C6",
  "severity": "HIGH" | "MEDIUM",
  "anchor": "<selector>",
  "file": "<resolved>",
  "recommendation": "cut" | "rewrite",
  "rationale": "magazine metaphor (Vol./Issue/p.0N/Sheet/Feature/Product no.) on a scroll page"
}
```

## Step SC4 — Apply F1 (unlabeled inputs)

For each entry in `unlabeled_inputs`, emit a finding:

```json
{
  "rule": "F1",
  "severity": "HIGH",
  "anchor": "<selector>",
  "file": "<resolved>",
  "recommendation": "rewrite",
  "rationale": "input has no visible label; placeholder-only labels disappear on focus"
}
```

## Step SC5 — Apply F2 (missing required indicators)

For each entry in `missing_required_indicators`, emit a finding with `severity: MEDIUM`, `recommendation: rewrite`, and a rationale citing WCAG 3.3.2.

## Step SC6 — Apply TS, CL, MO, DC, HI rules

For typography, color, motion, decoration, hierarchy:

- Use the page metrics already produced by `compute-metrics.js`:
  - `typeface_count` → TS1 violation if > 2.
  - `color_count` → CL1 violation if > 5.
  - `decoration_effects` → DC1 page-level signal (per-section is harder; flag only if total > 3 × section_count).
- For HI1 (one primary CTA per section): use the section map's `ctas` field per section. Flag any section where `ctas > 1`.
- For HI2 (heading order): inspect the section map's `heading` fields and flag any skipped levels.

Each violation emits a finding with `severity: MEDIUM` and a rationale citing the rule code.

## Step SC7 — Merge findings into the audit report

All SC findings join the primary finding list, sorted by severity (HIGH → MEDIUM → LOW). They appear under the existing "Secondary checks" section of the chat report (defined in `workflows/output-formats.md`), alongside the metric-based TS/CL/DC findings already produced by `compute-metrics.js`.
