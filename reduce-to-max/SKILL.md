---
name: reduce-to-max
description: |
  Audit a running website for information overload, redundant sections, and comprehension gaps. Recommends or applies editorial cuts so each page does its one job with the minimum sections and words required. Use when the user says "declutter", "reduce to max", "the page feels overloaded", "less is more on this page", or "audit this page for overload". Operates against a local dev server URL; reads source code only to locate sections; never migrates the stack.
---

This skill reduces marketing pages to the minimum needed to do their job. It is editorial in spirit, not visual. It runs in three modes — Audit, Propose, Apply — gated by preflight. It can audit a single route or two or more routes for cross-page IA.

## When to invoke

Trigger phrases (Claude matches by intent, not by literal string):

- "declutter `<route>`" → Audit mode, single route.
- "declutter `<route>` show me" / "with overlay" / "visual mode" → Audit + browser overlay.
- "declutter `<route>` and apply" → Apply mode (preflight gate fires first).
- "declutter `<route1>` and `<route2>` ..." → Audit, multi-route, cross-page IA enabled.
- "the page feels overloaded" / "reduce to max" → ask which route, then Audit.
- "declutter `<base-url>`" (bare host, no path or just `/`) → run `workflows/route-discovery.md` first; then audit all kept routes.
- "declutter all pages at `<base-url>`" / "declutter my website" → same as above; if no base URL given, the route-discovery workflow asks for it.

The matched mode is a proposal. Preflight always confirms it explicitly with the user before any analysis or write happens.

## Phases (in order)

Read the linked workflow file before executing each phase. Each phase produces a structured handoff the next phase consumes.

0. **Route discovery** (only when triggered by bare base URL or "all pages" / "my website" phrasing) — see `workflows/route-discovery.md`. Determines the route list before preflight.
1. **Preflight** — see `workflows/preflight.md`. Server reachability, git state, branch offer, mode pick, scope confirmation.
2. **Intent discovery** — see `workflows/intent-discovery.md`. Read the narrow declarative set; synthesize product intent and per-route page purpose; user confirms.
3. **Page analysis** — see `workflows/page-analysis.md`. Per route: detect stack, run `scripts/extract-sections.js` and `scripts/compute-metrics.js`, resolve file:line, hand to the LLM for per-section claim writing.
4. **Comprehensibility audit** — see `workflows/comprehensibility-audit.md`. Apply C1–C4 from `principles/comprehensibility.md`.
5. **Redundancy audit** — see `workflows/redundancy-audit.md`. Cluster section claims; recommend cut / merge / shorten / keep.
6. **Cross-page IA** — see `workflows/cross-page-ia.md`. Multi-route runs only.
7. **Editorial + secondary checks** — apply `principles/editorial.md` against the metrics; then run `workflows/secondary-checks-audit.md` to enforce `principles/secondary-checks.md` (TS, CL, MO, DC, HI, F1-F4) and `principles/comprehensibility.md` C5, C6 via `scripts/scan-content.js`.
8. **Output** — see `workflows/output-formats.md`. Default chat report; opt-in browser overlay via `scripts/overlay-render.js`.
9. **Apply** — see `workflows/apply-mode.md`. Apply mode only.

## Inputs

- A dev server URL (one or more routes).
- The repo containing the site source.

## Inputs the skill explicitly does not consume

- Source code beyond what is needed to resolve `file:line` for a section.
- Tests, configs, lockfiles.
- Third-party docs, GitHub APIs, or any network resource other than the dev server URL itself.

## Output

- Default: a structured chat report (see `workflows/output-formats.md`).
- Opt-in: a browser overlay annotated against the live dev server.
- In Apply mode: file edits and one commit per route audited. No push, no PR.

## Principle docs

- `principles/editorial.md` — primary; word/section/CTA limits.
- `principles/comprehensibility.md` — primary; C1–C4.
- `principles/cross-page-ia.md` — primary in multi-route mode; X1–X3.
- `principles/secondary-checks.md` — secondary; typography, color, motion, decoration, hierarchy.

## Helper scripts

The QuickJS dev-browser sandbox does not expose `process.argv`. Each helper reads its target URL from a top-of-file `URL` constant. The skill's runtime caller substitutes that constant before invoking, e.g.:

```bash
sed -i.bak 's|^const URL = .*|const URL = "http://127.0.0.1:8011/gaze";|' scripts/extract-sections.js
dev-browser run scripts/extract-sections.js
```

Or alternatively, inject via stdin pipeline:

```bash
{ echo "const URL = \"http://127.0.0.1:8011/gaze\";"; tail -n +1 scripts/extract-sections.js | grep -v '^const URL'; } | dev-browser
```

The four helpers:

- `scripts/discover-routes.js` — discover marketing routes from a base URL (sitemap → crawl, filtered).
- `scripts/extract-sections.js` — emits per-section JSON for a URL.
- `scripts/compute-metrics.js` — emits page-level metrics JSON for a URL.
- `scripts/overlay-render.js` — renders an outline overlay; reads `~/.dev-browser/tmp/overlay-findings.json`.

## What this skill never does

- Visual redesign or stack migration.
- New copy authoring beyond minor tightening.
- Image, illustration, or media file edits.
- `git push` or `gh pr create`.
- Network reads other than the dev server URL.
