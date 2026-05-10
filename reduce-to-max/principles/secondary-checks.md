# Secondary checks

These run after editorial and comprehensibility audits. They do not propose redesigns; they only flag egregious cases.

## Typography

| Rule  | Threshold                       | Source         |
|-------|---------------------------------|----------------|
| TS1   | ≤ 2 typefaces in use            | Refactoring UI |
| TS2   | ≤ 6 distinct font sizes         | Refactoring UI |
| TS3   | ≤ 4 distinct font weights       | Refactoring UI |

**Why it matters (TS1):** More typefaces increases cognitive load without adding hierarchy.

**Why it matters (TS2):** Type scales fragment when sizes proliferate; readers lose the visual rhythm.

**Why it matters (TS3):** Weight density exceeds what the eye can rank; emphasis loses meaning.

## Color

| Rule  | Threshold                                            | Source         |
|-------|------------------------------------------------------|----------------|
| CL1   | ≤ 5 distinct foreground colors (excluding neutrals)  | Refactoring UI |
| CL2   | Body text contrast ≥ 4.5:1                           | WCAG 2.2 1.4.3 |
| CL3   | Large text contrast ≥ 3:1                            | WCAG 2.2 1.4.3 |

**Why it matters (CL1):** Palettes wider than five colors stop being a system and start being noise.

**Why it matters (CL2):** Lower contrast excludes readers with low vision and fatigues all readers in bright environments.

**Why it matters (CL3):** Same accessibility floor for headings; failing it means key copy is hard to read.

## Motion

| Rule  | Threshold                                                                  | Source        |
|-------|----------------------------------------------------------------------------|---------------|
| MO1   | `prefers-reduced-motion: reduce` honored on at least the page-load animation | WCAG 2.2 2.3.3 |
| MO2   | No more than 1 auto-playing animation visible per viewport at any time     | NN/g           |

**Why it matters (MO1):** Without `prefers-reduced-motion`, vestibular-sensitive users get nausea or vertigo; motion is a hostile choice on by default.

**Why it matters (MO2):** Competing motion blocks reading; readers chase the moving thing instead of the message.

## Decoration

| Rule  | Threshold                                                       | Source         |
|-------|-----------------------------------------------------------------|----------------|
| DC1   | ≤ 3 decorative effects per section (gradient, glow, shadow, border, blur, grain) | Refactoring UI |
| DC2   | Decoration must serve hierarchy; flag effects with no functional role          | Rams (less but better) |

**Why it matters (DC1):** Stacking gradients, glows, and shadows trains readers to ignore decoration entirely; real emphasis stops working.

**Why it matters (DC2):** Decoration without function adds visual weight to elements that don't deserve it; readers misjudge importance.

## Hierarchy

| Rule  | Threshold                                                           | Source         |
|-------|---------------------------------------------------------------------|----------------|
| HI1   | One primary CTA per section                                         | Refactoring UI |
| HI2   | Heading order on the page must not skip levels (h1 → h3)            | NN/g           |

**Why it matters (HI1):** Multiple primary CTAs force a decision the reader didn't ask for; conversion drops as choice multiplies.

**Why it matters (HI2):** Skipped levels (h1 → h3) break screen-reader navigation and weaken visual hierarchy for sighted readers.

## Forms

| Rule  | Threshold                                                              | Source         |
|-------|------------------------------------------------------------------------|----------------|
| F1    | Every form input has a visible, persistent label                       | WCAG 2.2 3.3.2 |
| F2    | Required fields are indicated (asterisk, "required" text, or aria-required) | WCAG 2.2 3.3.2 |
| F3    | Errors are announced inline and reference the offending field by name  | WCAG 2.2 3.3.1 |
| F4    | Inputs use `autocomplete` for known fields (name, email, organization) | WCAG 2.2 1.3.5 |

**Why it matters (F1):** Placeholder-only labels disappear on focus. Sighted users lose context mid-typing; screen readers announce "edit, edit, edit" with no field name.
**Why it matters (F2):** A reader filling a form does not know which fields they can skip. Submitting a partial form and bouncing back with errors is the wrong-time cost.
**Why it matters (F3):** Generic "Error" messages without a field reference force the reader to scan the form looking for the broken row.
**Why it matters (F4):** Without `autocomplete`, password managers and OS autofill cannot pre-fill the form. Conversion rates drop because users abandon mid-entry.

## Output shape for secondary findings

Each finding states the rule code (e.g., TS1, CL2), the observed value, the threshold, and the file:line of the offending element. Secondary findings are reported under a separate "Secondary checks" heading in the chat report so they do not crowd the primary editorial work.
