# solo-multi-agent-brainstorm — rev-3.1 (v1.2.1)

**Date:** 2026-05-15
**Issue:** #10 — document synthesizer-bias risk
**Base:** rev-3 (v1.2). Incremental change record; full file text superseded by `rev-5.md`.

## Why

The panel gets vendor-diversity hedging against correlated bias. The synthesis
layer does not — it is a single LLM. POSITION/TOP_RISK lines are quoted verbatim
and trustworthy, but the cross-panelist judgment (what converged, which dissent
matters, what is "minor") is one model's framing and was previously presented as
neutral fact.

## Changes (SKILL.md)

1. **New anti-pattern** under Anti-Patterns:
   > Trust the synthesis layer's neutrality. The synthesizer is a single LLM.
   > POSITION lines are quoted verbatim, but cross-panelist judgments (what's
   > the convergence? what dissent matters?) are still one model's framing. The
   > panel's vendor diversity does NOT cover the synthesizer — name it in the
   > verdict and read its convergence claims as one vendor's read.

2. **Synthesis Discipline** gained a minority-risk rule:
   > If a panelist named a failure mode no one else addressed, treat it as a
   > finding, not noise — even if it's a 1-of-3 minority.
   Plus a closing paragraph: honest compression is the goal — compress the
   prose, never the disagreement; if unsure whether a dissent is signal, keep it.

3. **Provenance & Usage block**:
   - Diversity-assessment heading now reads "(panel only — does NOT cover the
     synthesizer)".
   - "Orchestrator" line renamed "Orchestrator / synthesizer" and now names the
     vendor + model explicitly.
   - Added a blockquote stating the diversity assessment does not extend to the
     synthesis layer and that a true cross-check requires swapping the
     orchestrator vendor too.

## Constraint honored

Synthesis stays prose, not a tabular dump. The orchestrator's job IS to
compress; the change targets *honest* compression (keep dissent) rather than
*no* compression.
