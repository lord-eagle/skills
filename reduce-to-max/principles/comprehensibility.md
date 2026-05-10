# Comprehensibility principles

A section is comprehensible if a first-time reader can answer three questions after reading it:

1. **What is this section claiming?** (A single sentence the reader could repeat.)
2. **Why does this claim help the page's job?** (Connects to the page purpose.)
3. **What can I do or know now that I could not before?** (Action or insight.)

If the skill cannot itself answer all three on the section's behalf, the section fails comprehensibility.

## Rule C1 — Summarizability

Every section must reduce to one sentence describing what it claims. The skill writes the sentence. If it cannot, the section is flagged.

Examples of non-summarizable sections:
- A faux-magazine TOC listing `01 · Cover · p.01` through `06 · Design partner · p.06` on a single scrolling page. The metaphor (page numbers, chapters) does not exist on the medium (a scroll page). The section "claims" nothing the reader can act on.
- A stat strip with `01.A · 3 products · 1 live · 0 data retained · EU hosted` where most stats are decorative codes (`01.A`) rather than facts.
- A code block with no caption, no input, no output, and no surrounding explanation.

**Why it matters:** A section without a summarizable claim makes the reader work to extract intent. Pages reward scanning; sections that resist a one-sentence reduction add friction without payoff.

## Rule C2 — Medium fit

A section borrows a metaphor from another medium only when the metaphor adds function on this medium.

| Borrowed metaphor                  | OK on the web?                                   |
|------------------------------------|--------------------------------------------------|
| Page numbers / chapter index       | No — there are no pages on a single scroll page  |
| Terminal prompt (`$ pip install`)  | OK only when the line is a real, copyable command |
| Footnote markers                   | OK only when there are real footnotes            |
| Magazine pull-quote                | OK as decoration if it shortens, not adds, copy  |
| Card-deck shuffle metaphor         | No — implies an action that does not exist       |

**Why it matters:** Borrowed metaphors (page numbers on a scroll page, terminal prompts on prose) imply functions that don't exist. Readers spend cycles checking what they can do; they get nothing back.

## Rule C3 — Takeaway

A section that leaves the reader with no fact, no decision support, and no next step is decorative-only and is flagged for cut or merge.

**Why it matters:** A section that leaves no fact, decision support, or next step costs scroll depth without moving the reader closer to the page's job.

## Rule C4 — Decoration dressed as content

Stat strips, badge rows, and "by the numbers" blocks must commit to specific, verifiable claims. Vague codes (`01.A`, `v0`, `EU` without a target audience implied) are decoration with the appearance of content. Flag and recommend either commit-to-a-claim or cut.

**Why it matters:** Vague codes dressed as data (`01.A`, `v0`) look authoritative but commit to nothing. The reader can't verify or act on them; they erode trust elsewhere on the page.

## Rule C5 — Internal-language leak

A public marketing page must not contain references that only make sense to internal staff: admin URLs (`/admin/*`, `/internal/*`), dev TODOs (`TODO:`, `FIXME:`, `WIP`), staging hostnames, internal naming codes, or developer-facing instructions like "Toggle visibility from `/admin/...`".

**Why it matters:** Internal references on public pages signal carelessness, leak system structure to anyone who reads them, and confuse readers who can't act on them. Each leak is a credibility tax.

Recommendations:
- **CUT** if the line is purely instructional ("Toggle from /admin/...").
- **REWRITE** if the line carries real information but uses internal naming (replace `gaze-laravel-v2` with the public name).
- Move admin instructions to README, code comments, or an internal docs site.

## Rule C6 — Metaphor recurrence beyond removed dividers

After cutting magazine-metaphor divider sections (Sheet 0N/05, page-number TOCs), the same borrowed metaphor often recurs in section eyebrows or labels: `Vol. 02 · Issue 05`, `Feature · 1 of 4`, `Product no.01`, `Sheet 06 / 05`. These are residual occurrences of the same C2 violation; the audit must continue scanning section eyebrows after the dividers are gone.

**Why it matters:** Cutting only the obvious occurrences leaves a confusing aftermath: the page still pretends to be a magazine, just without the table of contents. Readers notice the residue and the cleanup feels incomplete.

Recommendations:
- **CUT** the eyebrow string entirely if it carries no information beyond the metaphor.
- **REWRITE** to drop the magazine framing while keeping any real label text (`Vol. 02 · Issue 05 · Trust matrix` → `Trust matrix`).

## Output shape for comprehensibility findings

Each finding includes:
- Which rule (C1–C4) was violated.
- The section's DOM anchor and `file:line` reference.
- The skill's attempt at a one-sentence claim — empty if it could not write one.
- The recommendation: **cut**, **rewrite to commit to a claim**, or **merge into a stronger section**.
