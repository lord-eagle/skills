# Intent discovery workflow

Runs after preflight. Establishes the source of truth the audit grades against.

## Inputs

The narrow declarative set (read-only):

1. `README.md` at the repo root.
2. `package.json` `description` field, if present.
3. For each target route, the rendered `<title>` and `<meta name="description">`.
4. Any of these positioning files at the repo root or under `docs/`: `BRAND.md`, `ABOUT.md`, `positioning.md`, `mission.md`.
5. The nearest `CLAUDE.md` or `AGENTS.md`, for project conventions only (not as positioning).

The skill **does not** read source code, configs, tests, lockfiles, or third-party docs.

## Step I1 — Read inputs

Use `Read` for files. Use `dev-browser` for `<title>` / `<meta>`:

```js
const page = await browser.getPage("intent-probe");
await page.goto(URL, { waitUntil: "domcontentloaded" });
const meta = await page.evaluate(() => ({
  title: document.title,
  desc: document.querySelector('meta[name="description"]')?.content || null,
}));
console.log(JSON.stringify(meta));
```

## Step I2 — Synthesize

Produce two sentences per target route:

- **Product intent:** What the product is, in one sentence drawn from the inputs.
- **Page purpose:** What this specific route's job is, in one sentence drawn from the inputs.

Both sentences avoid marketing adjectives (pick verbs and nouns over qualifiers).

## Step I3 — Confirm with user

Print both sentences and ask:

> "Product intent: `…` Page purpose for `/gaze`: `…` Accept, or edit?"

The user accepts, edits, or rejects. The accepted sentences become the rubric for everything downstream.

## Step I4 — Surface contradictions early

Compare each accepted sentence to the section claims the page makes (gathered later in `page-analysis`). Any contradiction is a finding tagged `INTENT_DRIFT` and reported in the chat report alongside other findings.

## Output of intent discovery

```json
{
  "product_intent": "...",
  "page_purposes": { "/gaze": "...", "/": "..." }
}
```
