---
name: solo-multi-agent-brainstorm
description: Run a moderated panel discussion across multiple Solo MCP projects and AI agents. Spawns 3 panelists (personas, cross-project lenses, or hybrid), runs N rounds with synthesis between rounds, delivers final verdict. TRIGGER when user says "brainstorm with panel", "get multiple perspectives", "debate this", "/panel", or wants cross-project / multi-agent input on a decision. SKIP for quick questions, single-perspective tasks, time-critical work, or when superpowers:brainstorming alone is sufficient.
---

# Solo Multi-Agent Brainstorm — Moderated Panel Across Projects and Agents

Turn a 1:1 brainstorm into a small panel discussion. Each panelist runs as its own Solo MCP agent, optionally rooted in a different project (own codebase context) or running on a different AI runtime (Claude / Codex / Gemini). The orchestrator moderates: dispatches rounds, synthesizes, decides convergence, delivers verdict.

Built on `solo-orchestration` (mechanism layer). Read that first if unfamiliar — this skill assumes its push patterns and cross-project scoping rules.

## When To Use

| Situation | This skill | superpowers:brainstorming |
|-----------|-----------|---------------------------|
| Quick question with one likely answer | — | use this |
| Solo design exploration | — | use this |
| Decision spanning multiple repos / teams | **use this** | — |
| High-stakes architecture call with non-obvious tradeoffs | **use this** | — |
| Want different AI vendors weighing in | **use this** | — |
| Time-critical (<10 min) | — | use this |

Cost reality: 3 panelists × 4 rounds ≈ 12-16 LLM calls + orchestrator synthesis. Reserve for decisions that justify that.

## Modes

| Mode | Panel composition | When |
|------|-------------------|------|
| `personas` | All panelists in orchestrator's project, distinct lens each | Single-repo design |
| `cross-project` | One panelist per relevant project, cross-codebase grounding | Decisions spanning system boundaries |
| `hybrid` (default) | Mix of personas + cross-project lenses | Most real decisions |

Mode is runtime decision based on topic. Default to `hybrid`.

## v1 Scope

In:
- All three modes
- Project selection: `list_projects()` → suggest → user confirm
- Fixed agent runtime (use first available `agent_tool_id` for all panelists)
- Round protocol with synthesis + convergence detection
- Final verdict archived to orchestrator-project scratchpad
- Read-only enforcement + secret-leak guard in panelist seed
- Cross-project scoping per `solo-orchestration` rules

Deferred:
- Runtime-aware assignment (v2 — see `lord-eagle/skills` issue #2)
- `NEED_PANELIST` mid-flight requests (v2)
- Orchestrator context handoff (v3 — issue #3)
- Recursive sub-panelists (forbidden permanently)

## Defaults

| Knob | Default | Reason |
|------|---------|--------|
| Panel size | 3 | Enough for disagreement, small enough to quote each verbatim |
| MAX_ROUNDS | 4 | Diminishing returns past 3, hard cap at 4 |
| Convergence | DELTA="no change" 2 rounds OR POSITION cluster | Stop when stable |
| Per-round response cap | 300 words | Token discipline |
| Synthesis cap | 500 words | Orchestrator memory bound |
| Round timeout | 10 min | Generous safety net |

## Persona Library (starting set)

```
PERSONAS = {
  "skeptic":     "find weakest assumption, demand evidence",
  "pragmatist":  "what ships this week, cost vs value",
  "architect":   "long-term shape, coupling, blast radius",
  "contrarian":  "argue opposite of consensus",
  "user-advocate": "what does the end user actually feel",
}
```

Pick 3 distinct lenses per brainstorm. Add domain personas as needed.

## Cross-Project Lens Selection

```
projects = list_projects()
# Score each project for topic relevance:
#   - Keyword match on project name/description
#   - User-provided context
# Present top 3-5 to user, mark suggested with [x]:
#
# Topic: "rename /users endpoint to /accounts"
# Suggested panel:
#   [x] artistfy-api      (backend-eye)
#   [x] artistfy-web      (frontend-eye)
#   [x] artistfy-docs     (docs-eye)
#   [ ] artistfy-infra    (low relevance)
# Confirm? [y/edit/cancel]
```

Spawn each confirmed panelist with `project_id=<that project>`. The agent boots inside that project's repo with full local tooling.

## Panelist Seed Prompt Template

Prepend to first `send_input` after `spawn_process(kind="agent", project_id=PANEL_PROJECT_ID)`. Also prepend `agent_instructions` returned by spawn.

```
You are panelist {PANEL_NAME} (process {SPAWN_PID}) in a moderated brainstorm.
Orchestrator pid: {ORCH_PID}. Orchestrator project_id: {ORCH_PROJECT_ID}.
You represent: {PROJECT_OR_PERSONA_LABEL}
Your lens: {LENS_DESCRIPTION}

CONSTRAINTS:
- READ-ONLY. You are a consultant, not implementer. Do NOT modify files in your project.
- Do NOT echo file contents verbatim in callbacks. Summarize patterns, not values. Never quote .env, secrets, credentials, tokens.
- You may NOT call spawn_process. No sub-panelists. Reason within your own session only.
- Stay in character every round. Re-read your lens before responding.

REPORTING CONTRACT:
Per round, write your response to scratchpad in orchestrator's project:
  scratchpad_write(
    name="panel-{SPAWN_PID}-round-{N}",
    project_id="{ORCH_PROJECT_ID}",
    content=<full response, ≤300 words, ending with the three required lines below>
  )

Required ending lines (exact format):
  POSITION: <one line — your current stance>
  TOP_RISK: <one line — biggest risk you see>
  DELTA: <what changed your view since last round, or "initial">

Then signal completion:
  send_input(
    process_id="{ORCH_PID}",
    project_id="{ORCH_PROJECT_ID}",
    input="PANEL {SPAWN_PID} ROUND {N} DONE"
  )

ALWAYS pass project_id on cross-project send_input and scratchpad calls — your default scope differs from orchestrator's.
Do NOT send_input for intermediate progress within a round.
```

## Round Prompt Template

Sent to each panelist at the start of round N (after seed):

```
TOPIC: {TOPIC}
ROUND: {N} of {MAX_ROUNDS}

PRIOR ROUNDS SYNTHESIS:
{ORCHESTRATOR_SYNTHESIS_OR_"initial round"}

YOUR LENS (re-stated): {LENS_DESCRIPTION}

Respond per the reporting contract from your seed prompt. Stay ≤300 words.
End with POSITION / TOP_RISK / DELTA lines.
```

Re-stating lens every round prevents persona drift.

## Orchestrator Recipe

```
# 1. Pre-flight
me = whoami()
ORCH_PID = me.process_id
ORCH_PROJECT_ID = me.project_id

agents = list_agent_tools()
# v1: pick first available agent_tool_id, use for all panelists
AGENT_ID = agents[0].id

# 2. Resolve panel composition
projects = list_projects()
panel_plan = build_panel(topic, mode, projects)  # see Cross-Project Lens Selection
confirm_with_user(panel_plan)

# 3. Spawn panelists
panel = []  # list of (pid, project_id, label, lens)
for entry in panel_plan:
    r = spawn_process(
        kind="agent",
        agent_tool_id=AGENT_ID,
        name=f"panelist-{entry.label}",
        project_id=entry.project_id,
    )
    seed = SEED_TEMPLATE.format(
        SPAWN_PID=r.process_id, ORCH_PID=ORCH_PID, ORCH_PROJECT_ID=ORCH_PROJECT_ID,
        PANEL_NAME=entry.label, PROJECT_OR_PERSONA_LABEL=entry.label,
        LENS_DESCRIPTION=entry.lens,
    )
    send_input(r.process_id, r.agent_instructions + "\n\n" + seed)
    panel.append((r.process_id, entry.project_id, entry.label, entry.lens))

# 4. Round loop
synthesis = "initial round"
for round_n in range(1, MAX_ROUNDS + 1):
    # Dispatch
    for pid, _, label, lens in panel:
        send_input(pid, ROUND_TEMPLATE.format(
            TOPIC=topic, N=round_n, MAX_ROUNDS=MAX_ROUNDS,
            ORCHESTRATOR_SYNTHESIS_OR_INITIAL=synthesis,
            LENS_DESCRIPTION=lens,
        ))

    # Wait fan-in (Pattern C: send_input + idle-timer safety net)
    timer_fire_when_idle_all(
        processes=[pid for pid, _, _, _ in panel],
        max_wait_ms=10 * 60 * 1000,
        body=f"Round {round_n} fan-in. Read panel-<pid>-round-{round_n} scratchpads for any panelist that did not send_input."
    )

    # On wake: collect responses
    responses = []
    for pid, _, label, _ in panel:
        content = scratchpad_read(
            name=f"panel-{pid}-round-{round_n}",
            project_id=ORCH_PROJECT_ID,
        )
        responses.append((label, content, parse_position_lines(content)))

    # Synthesize — quote POSITION/TOP_RISK lines verbatim, do NOT paraphrase away dissent
    synthesis = synthesize(topic, round_n, responses)  # ≤500 words

    # Convergence check
    if converged(responses, prior_synthesis):
        break

# 5. Deliver verdict
verdict = build_verdict(topic, panel_plan, synthesis, rounds_run=round_n)
present_to_user(verdict)

# 6. Archive
scratchpad_write(
    name=f"brainstorm-{slugify(topic)}-{today}",
    project_id=ORCH_PROJECT_ID,
    content=verdict,
)

# 7. Cleanup
for pid, _, _, _ in panel:
    scratchpad_archive(name=f"panel-{pid}-round-*", project_id=ORCH_PROJECT_ID)
    close_process(pid)
```

## Convergence Detection

Stop when ANY of:
- All panelists' DELTA = "initial" or "no change" for two consecutive rounds
- POSITION lines cluster (semantic overlap on outcome — orchestrator judgment)
- `round_n == MAX_ROUNDS`
- User interrupts with explicit verdict

Do not loop past convergence. Diminishing returns are real.

## Synthesis Discipline

Orchestrator is the bias bottleneck. To fight it:
- Quote each panelist's POSITION + TOP_RISK lines **verbatim** in the synthesis section
- Paraphrase only in the meta-summary, never in position attribution
- Note where synthesis is the orchestrator's own framing vs panelist words
- If a panelist disagrees strongly, surface that disagreement — do not smooth it away
- Final verdict must show the spread, not just the consensus

## What User Sees

User does NOT watch panelist chatter live. User sees:
1. Setup confirmation (panel plan)
2. Per-round summary (one paragraph + POSITION lines per panelist)
3. Final verdict + decision rationale
4. Archive scratchpad name for later recall

Like meeting minutes, not the meeting itself.

## Anti-Patterns

Do NOT:
- Spawn panelist without `project_id` — Solo will guess wrong
- Forget READ-ONLY constraint in seed — panelist may modify its project
- Forget secret-leak guard — panelist may quote .env contents in callback
- Allow panelist to call `spawn_process` — recursion explosion
- Use `timer_set(loop=true)` for round dispatch — wastes cache
- Send round prompt before all panelists from prior round have completed — race
- Paraphrase POSITION lines in synthesis — bias drift
- Skip convergence check and loop to MAX_ROUNDS by default — wasted tokens
- Forget `close_process` per panelist + scratchpad archive on exit — pid + storage leak
- Mix orchestrator-project scratchpad writes from panelists without `project_id=ORCH_PROJECT_ID` — silently lost

## When To Skip This Skill

- Quick technical question with one right answer
- Solo design exploration where one perspective is enough → `superpowers:brainstorming`
- Time-critical decision (<10 min available)
- No Solo MCP available locally
- Only one project or one agent runtime registered AND topic doesn't benefit from persona panel
- User wants to think alone

## Related Skills

- `solo-orchestration` — push patterns, cross-project scoping. Read first.
- `superpowers:brainstorming` — solo brainstorm fallback
- `superpowers:writing-plans` — natural follow-up after panel reaches consensus

## Quick Reference

| Need | Action |
|------|--------|
| Discover panelist projects | `list_projects()` |
| Discover agent runtimes | `list_agent_tools()` (v1: use first; v2: assignment matrix) |
| Spawn panelist in another project | `spawn_process(kind="agent", project_id=X)` |
| Dispatch round | `send_input(panel_pid, ROUND_TEMPLATE, project_id=panel.project_id)` |
| Wait for round complete | `timer_fire_when_idle_all(processes=panel_pids, max_wait_ms=600000)` |
| Read panelist response | `scratchpad_read(name="panel-{pid}-round-{N}", project_id=ORCH_PROJECT_ID)` |
| Archive verdict | `scratchpad_write(name="brainstorm-{slug}-{date}", project_id=ORCH_PROJECT_ID)` |
| Tear down panelist | `scratchpad_archive` per round + `close_process(pid)` |
