# Cross-page IA workflow

Active only when the user audit list contains two or more routes. Runs after each route has completed page-analysis, comprehensibility, and redundancy.

## Step XA1 — Build a route-by-claim table

| Claim (one sentence)                              | / | /gaze |
|---------------------------------------------------|---|-------|
| Anonymization gateway between humans and LLMs    | x | x     |
| Studio at a glance: 3 products, 1 live, 0 retained, EU | x | x     |
| Trust posture, no certification theater          |   | x     |
| Open-core family list                             | x |       |

Mark each claim with the routes where it appears.

## Step XA2 — Apply Rule X1 (one-route ownership)

For any claim that appears on more than one route, decide which route owns it. Use Rule X2 (scope fit) as the deciding factor:

- Brand/positioning claims → landing.
- Product mechanics, install steps, and product-specific value → product page.
- Roadmap/family claims → landing or footer.
- Compliance/trust posture → landing (linked from product pages).

## Step XA3 — Apply Rule X3 (consistency)

For claims that legitimately appear on multiple routes (e.g., a brand line in the header), check that wording is identical. Wording drift on the same fact is a finding.

## Step XA4 — Emit cross-page findings

Each finding includes:

- The claim text.
- The routes carrying it with file:line.
- The recommended owner route.
- The recommendation per other route: **cut**, **link to owner**, or **rewrite to a different claim**.
- For Rule X3: the variants and a recommended canonical wording.
