# solo-multi-agent-brainstorm — rev-4 (v1.3)

**Date:** 2026-05-15
**Issue:** #6 — optional auto-archive of prior verdict pads at brainstorm start
**Base:** rev-3.1 (v1.2.1). Incremental change record; full file text in `rev-5.md`.

## Why

Repeated brainstorms in the same orchestrator project accumulate
`brainstorm-verdict` scratchpads. Stale verdicts clutter recall and can be
mistaken for the current decision. Cleanup should be offered — but never
silently performed, since a prior verdict may still be the active reference.

## Changes (SKILL.md)

1. **Orchestrator recipe, new step 1a** (pre-flight):
   - List scratchpads tagged `brainstorm-verdict` (non-archived) in
     `ORCH_PROJECT_ID`.
   - If any found, prompt verbatim:
     `"{N} prior verdict scratchpads found ({pad ids + slugified names}). Archive them? [y/n/list]"`
   - `list` → show name + date per pad, then re-prompt `[y/n]`.
   - `y` → archive each. `n` → leave untouched.

2. **Default = ASK, never auto-archive.** Auto-archive only if the user
   explicitly opts in (answers `y`).

3. **No nag**: if the user declines, the skill does not ask again the same run.

4. **Documented explicitly** that the verdict-write step (step 6) uses
   `tags=["brainstorm-verdict"]`, and that this tag is precisely what step 1a's
   discovery depends on.

5. Quick Reference gained a "Housekeep prior verdicts" row.
