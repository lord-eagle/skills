# Cross-page information architecture principles

Active only when the user asks the skill to audit two or more routes in one run.

## Rule X1 — One-route ownership per claim

A given product claim should live on exactly one route. If `/` and `/gaze` both run a stats strip with the same numbers and the same framing, that is duplication. Recommend keeping the strip on the route whose **page purpose** most directly carries the claim. Cut from the other route.

**Why it matters:** When the same claim lives on multiple routes, every visitor pays for the duplication and the team owns N copies to keep in sync. Drift is inevitable.

## Rule X2 — Scope fit per route

A landing page (`/`) carries the **product-or-company-level positioning**. A product page (`/gaze`) carries the **product-specific value, mechanics, and call to action**. Claims should sit on the route whose scope matches.

| Claim type                               | Belongs on             |
|------------------------------------------|------------------------|
| "This is who we are / what we believe"   | Landing                |
| "This is what this product does and why" | Product page           |
| "Here is the install command"            | Product page or docs   |
| "Here are our other products"            | Landing or footer      |
| "Here is the trust / compliance posture" | Landing (then linked)  |

**Why it matters:** Claims placed on the wrong scope (product detail on landing, brand line on product page) dilute the route's primary job. Users get unfocused pages.

## Rule X3 — Cross-page consistency

Where the same fact does appear on multiple pages legitimately (e.g., a brand line in the header), it must appear in the same wording. Drift in wording on the same fact is itself a finding ("'EU-hosted' on `/` becomes 'hosted in the EU' on `/gaze' — pick one").

**Why it matters:** Wording drift on the same fact ("EU hosted" vs "EU-hosted") signals carelessness and creates ambiguity. Readers wonder if the two phrasings mean different things.

## Output shape for cross-page findings

Each finding includes:
- The claim text.
- The list of routes that carry it, each with `file:line`.
- The recommendation: which route keeps it, which drop it.
- For Rule X3 only: the variant strings and a recommended canonical wording.
