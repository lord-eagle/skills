# Route discovery workflow

Active when the user invokes the skill with a bare base URL (no path) or with the phrase "declutter all pages at <url>" / "declutter my website". Runs before `workflows/preflight.md` so the route list is decided before mode selection.

## Step RD1 — Determine the base URL

If the user gave a bare URL (`http://127.0.0.1:8011`, `http://127.0.0.1:8011/`), the base is that URL with any trailing slash removed.

If the user said "declutter my website" without a URL, ask:

> "What's the base URL of the site? (e.g., `http://127.0.0.1:8011` or `https://example.com`)"

Wait for response. Use that as the base.

## Step RD2 — Run discover-routes.js

Run `dev-browser run scripts/discover-routes.js` (override the `BASE` constant per the SKILL.md Helper scripts pattern). Parse the JSON output.

The script returns:
- `routes` — an array of `{ path, url }` representing the kept routes.
- `source` — `"sitemap"` or `"crawl"` indicating which method succeeded.
- `filtered` — list of paths the script discarded with reasons (non_public_pattern, file_extension, anchor_only).

## Step RD3 — Present routes to the user

Print a numbered list. Mark a default selection (all kept routes) and ask the user to deselect any they want to skip.

Format:

```
Discovered <N> routes via <source>:

  [x] 1. /
  [x] 2. /gaze
  [x] 3. /trust
  [x] 4. /privacy

Skipped <M> routes (admin/api/auth/file paths). View them?

Hit Enter to audit all four. Otherwise reply with route numbers to drop, e.g. "drop 4" or "only 1 and 2".
```

If the user says "view skipped" or similar, print the `filtered` list with reasons. Don't pre-fetch unless asked.

If the user replies with deselections, recompute the active set and re-print before continuing.

## Step RD4 — Hand off to preflight

The accepted route list becomes `routes` in the preflight run-state object. Continue with `workflows/preflight.md` as normal.

## When NOT to run this workflow

- The user gave one or more explicit routes (`declutter /gaze` or `declutter / and /gaze`). The route list is already known; preflight runs directly.
- The user gave the bare base URL **without** a trailing slash AND the user has previously confirmed in this session that bare-base means homepage. (Edge case; default behavior is to treat bare base as "discover all.")

## Edge cases

- **No sitemap, no anchors found.** The script returns an empty `routes` array with `source: "crawl"`. Tell the user: "Couldn't discover routes from `<base>`. Please list them: `declutter <r1> and <r2> ...`"
- **Sitemap is empty.** Same as no sitemap — fall through to crawl. The script does this automatically.
- **A route uses non-standard protocol or different origin.** The script filters these via same-origin check. They appear in `filtered` with reason `cross_origin` (note: not currently in the filter reason list — extend the script if this case appears in practice).
