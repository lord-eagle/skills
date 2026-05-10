# Preflight workflow

Runs before every skill invocation. No analysis or write happens before preflight passes.

## Step P1 — Confirm the dev server URL

Read the URL the user gave (e.g., `http://127.0.0.1:8011/gaze`). Make a single GET probe with `dev-browser`:

```js
const page = await browser.newPage();
try {
  await page.goto(USER_URL, { waitUntil: "domcontentloaded", timeout: 5000 });
  console.log(JSON.stringify({ ok: true, status: 200 }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
}
```

If `ok: false`, abort with: "Dev server unreachable at `<URL>`. Start it and re-run." Do not proceed.

## Step P2 — Inspect git state in the repo that owns the page source

The user's invocation implies a repo. Identify it from the cwd (`pwd`) and confirm with the user if ambiguous (multiple sites in one workspace). Then:

```bash
git -C "$REPO" status --porcelain
git -C "$REPO" branch --show-current
```

If `--porcelain` output is non-empty, the working tree is dirty. Present the user with four options:

1. Stash and proceed (`git stash push -u -m "reduce-to-max preflight"`).
2. Commit current changes first (skill exits; user commits manually; user re-runs).
3. Continue anyway (only allowed for Audit mode; refused for Propose/Apply).
4. Abort.

## Step P3 — Branch offer

Always offer to create a fresh branch before any potential edit. Default name: `design-cleanup/YYYY-MM-DD`. The user can stay on the current branch instead.

```bash
git -C "$REPO" switch -c "design-cleanup/$(date +%F)"   # only on user consent
```

## Step P4 — Mode selection

Even if the user's trigger phrase implied a mode, ask explicitly:

> "Mode? **Audit** (analyze and report only), **Propose** (audit and produce diffs you review before any write), or **Apply** (audit and edit files; you review the resulting diff)?"

Record the choice in the run state. Audit-mode runs may skip P2/P3 only if the user explicitly opts out and the working tree is clean. Propose and Apply always run P2 and P3.

## Step P5 — Scope confirmation (multi-route)

If the trigger named more than one route, confirm the route list verbatim before proceeding.

## Output of preflight

Return a structured run-state object the rest of the workflows consume:

```json
{
  "url": "http://127.0.0.1:8011/gaze",
  "routes": ["/gaze"],
  "repo": "/Users/.../gaze-website",
  "branch": "design-cleanup/2026-05-09",
  "mode": "audit",
  "dirty_handled": "stashed"
}
```
