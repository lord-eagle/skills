# Editorial principles

Editorial reduction is the **primary** category. The skill enforces these rules first.

## Page-level limits

| Metric                       | Threshold                | Source           |
|------------------------------|--------------------------|------------------|
| Total scroll height          | ≤ 4 viewport heights     | NN/g; Krug       |
| Sections per page            | ≤ 5                      | Refactoring UI   |
| Words above the fold         | ≤ 60                     | NN/g (scan rule) |
| Time-to-primary-CTA          | ≤ 2 sections from top    | Krug             |

A page that exceeds any of these is flagged. The skill does not auto-cut; it proposes which section is the cheapest cut to bring the metric back into bounds.

## Section-level limits

| Metric                       | Threshold                | Source           |
|------------------------------|--------------------------|------------------|
| Words per section            | ≤ 80                     | Krug             |
| Headings per section         | ≤ 2 (h2 + optional h3)   | Refactoring UI   |
| Primary CTAs per section     | ≤ 1                      | Refactoring UI   |
| Bulleted items in one list   | ≤ 5                      | NN/g             |

## What "primary CTA" means here

A button or link that asks the reader to take the page's main action (sign up, install, contact, try). Secondary navigation links and footer-style links do not count.

## Output shape for editorial findings

Each finding includes:
- The metric violated.
- The current value and the threshold.
- The cheapest cut the skill can identify (a specific section).
- A confidence score (high/medium/low) based on how clearly the section's claim is duplicated elsewhere.
