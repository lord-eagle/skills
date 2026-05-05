---
name: solo-orchestration
description: Orchestrate Solo MCP spawned agents with push-based reporting instead of polling. TRIGGER when user mentions "spawn agent", "orchestrate", "solo spawn", multi-agent workflow, or calls `spawn_process(kind="agent")`. SKIP for single-session work, non-Solo agent frameworks, or one-off terminal spawns.
---

# Solo Orchestration — Push, Don't Poll

Solo MCP spawned agents can report back to their orchestrator without the orchestrator polling on a timer. This skill defines the three push patterns and when to use each.

## Why This Matters

Polling burns tokens and cache:
- Every `get_process_output` check is a tool round-trip on the orchestrator
- Recurring `timer_set(..., loop=true)` injects user turns even when nothing changed
- 5-minute poll interval × hour-long task = 12 wasted context refreshes

Push-based reporting: orchestrator idle until spawn signals. Zero cost when nothing happens.

## The Three Patterns

### Pattern A — Idle-triggered timer (safety net)

Orchestrator registers one-shot timer that fires when spawn enters idle state.

```
timer_fire_when_idle_any(
  processes=[SPAWN_PID],
  max_wait_ms=1800000,
  body="Spawn SPAWN_PID went idle. Read scratchpad spawn-SPAWN_PID-status. get_process_output(SPAWN_PID, lines=80) if scratchpad missing. Decide: consume result, retry, or abort."
)
```

Use when: spawned agent cannot call back (non-agent runtime, external process, untrusted prompt).

Downside: idle != done. Spawn may be idle mid-task waiting for input.

### Pattern B — `send_input` callback (true push)

Spawn calls `send_input(orchestrator_pid, "...")`. Delivered as fresh user turn in orchestrator PTY.

Orchestrator must share its pid **and project_id** with spawn at launch. Use `whoami` to get both, then inject into spawn prompt. See "Cross-Project Scoping" below — this is the #1 footgun.

Use when: spawn is a Solo agent runtime (Claude/Codex/Gemini) you control.

Downside: spawn might forget to call back. Always pair with Pattern A as safety net.

### Pattern C — Combo (default, recommended)

1. Spawn writes progress to `scratchpad-{SPAWN_PID}-status` at milestones
2. Spawn `send_input` orchestrator on terminal events (DONE/BLOCKED/FAILED)
3. Orchestrator registers idle-timer with generous `max_wait_ms` as safety net
4. Orchestrator reads scratchpad on callback, not live output

Cheapest steady state. Resilient to spawn forgetting callback.

## Cross-Project Scoping (critical)

Solo MCP tools resolve `process_id` and scratchpad names in the **caller's** project scope. Orchestrator and spawn often live in different projects (orchestrator spawns a worker into the codebase being worked on). Without explicit `project_id`, spawn's `send_input(ORCH_PID, ...)` resolves in spawn's project → pid not found → Solo falls back to closest Claude in spawn's project → wrong session receives the callback.

Rules:
- Orchestrator captures `project_id` from `whoami()` — not just `process_id`.
- Spawn prompt includes `{ORCH_PROJECT_ID}`.
- Spawn passes `project_id={ORCH_PROJECT_ID}` on every `send_input` to orchestrator.
- Pick one project to host the scratchpad. Recommended: orchestrator's project. Spawn passes `project_id={ORCH_PROJECT_ID}` on `scratchpad_write` / `scratchpad_append`. Orchestrator reads without override.
- Same-project orchestration: `project_id` is harmless to pass → always pass it. Zero-cost safety.

## Spawn Prompt Template

Prepend to first `send_input` after `spawn_process(kind="agent")`. Also prepend the `agent_instructions` returned by `spawn_process`.

```
You are spawn process {SPAWN_PID}. Orchestrator pid: {ORCH_PID}. Orchestrator project_id: {ORCH_PROJECT_ID}.

Task: {TASK_DESCRIPTION}

Reporting contract:
1. Write progress to scratchpad "spawn-{SPAWN_PID}-status" in orchestrator's project:
     scratchpad_append(name="spawn-{SPAWN_PID}-status", project_id={ORCH_PROJECT_ID}, content=...)
   Milestone granularity only.
2. On terminal event (DONE, BLOCKED, FAILED) call:
   send_input(
     process_id={ORCH_PID},
     project_id={ORCH_PROJECT_ID},
     input="SPAWN {SPAWN_PID} {status}: {one-line summary}. Scratchpad: spawn-{SPAWN_PID}-status"
   )
3. Always pass project_id on send_input and scratchpad calls targeting orchestrator — your default scope differs.
4. Do NOT send_input for intermediate progress — scratchpad only.

Orchestrator has idle-timer safety net. send_input is preferred path.
Expected work duration: {DURATION_ESTIMATE}.
```

## Orchestrator Recipe

```
# 1. Resolve own pid + project_id FIRST
me = whoami()
orch_pid = me.process_id
orch_project_id = me.project_id

# 2. Spawn
result = spawn_process(kind="agent", agent_tool_id=N, name="worker-1")
spawn_pid = result.process_id

# 3. Seed spawn with reporting contract (inject orch_pid AND orch_project_id)
send_input(spawn_pid, AGENT_INSTRUCTIONS + "\n\n" + SPAWN_PROMPT_FILLED)

# 4. Register safety-net timer
timer_fire_when_idle_any(
  processes=[spawn_pid],
  max_wait_ms=2 * expected_duration_ms,
  body=f"Spawn {spawn_pid} idle. If no send_input received, read scratchpad spawn-{spawn_pid}-status. Decide next step."
)

# 5. Stop orchestrator activity. Wait for user-turn injection from either path.
```

## Efficiency Rules

- Scratchpad > send_input for progress. `send_input` injects user turn = full orchestrator re-render cost.
- Reserve `send_input` for terminal events only. One call per spawn lifecycle is ideal.
- Single scratchpad per spawn. Name `spawn-{pid}-status`. Orchestrator reads once on callback.
- `max_wait_ms` = 2× expected duration. Too short = premature fires. Too long = no safety.
- Close spawn process after result consumed: `close_process(spawn_pid)`. Prevents pid leak.
- Parallel spawns: one timer per spawn OR `timer_fire_when_idle_all([pids...])` if orchestrator waits for full fan-in.

## Anti-Patterns

Do NOT:
- `timer_set(60000, "check spawn", loop=true)` — burns cache on empty ticks
- `get_process_output` in a sleep loop — same as above
- Poll scratchpad with recurring timer — push model makes this pointless
- Short `max_wait_ms` (<30s) as retry mechanism — use Pattern B callback instead
- Forget `close_process` — orphaned pids accumulate
- Seed spawn with `orch_pid` but omit `orch_project_id` — callback silently misroutes when projects differ

## Multi-Vendor Preflight

Spawning a non-Claude runtime (Codex, Gemini, Amp, OpenCode) only works if that runtime has Solo MCP wired into its own config. Solo does NOT auto-inject. Without the wiring, the spawned agent has no `whoami` / `scratchpad_write` tools and cannot follow any reporting contract.

Run this preflight **once at the start of any multi-agent workflow**. It is the single source of truth for "which vendors can actually participate right now". Downstream skills (e.g. `solo-multi-agent-brainstorm`) MUST consume its output instead of building their own probe.

### What the preflight does

```
1. enabled = list_agent_tools()                         # Solo's own truth
2. For each tool: check vendor's user-config file for an `solo` MCP entry
3. If entry missing: patch idempotently (backup file as .bak-<unix-ts> first)
4. Health probe in parallel — spawn each, send minimal "whoami + scratchpad_write probe-{vendor}-{ts} + close"
   timeout 30s per vendor (Claude needs >20s on cold boot)
5. Classify each vendor:
     OK            → ready to use
     NEEDS_AUTH    → CLI booted but blocked on interactive auth screen (Gemini, Amp)
     CLI_MISSING   → CLI binary not on Solo's subshell PATH (Solo runs nvm-managed shell)
     BOOT_LOOP     → CLI exits before accepting input (e.g. self-update on first run)
     MCP_MISSING   → MCP entry patched but agent still cannot resolve solo tools
     SUBMIT_BUG    → CLI accepts text but never executes (Codex needed raw CR `[13]`)
6. Archive probe scratchpads. Return: [(tool_id, name, status, hint)]
```

The downstream skill picks vendors with `status == OK`. Anything else is surfaced to the user with the install/auth hint and excluded.

### Vendor config registry

Solo MCP binary path: `/Applications/Solo.app/Contents/MacOS/mcp` (on macOS). Use the absolute path in every vendor config — none of these CLIs resolve `solo` from PATH the same way Claude does.

| Vendor | Config file | Format | MCP entry shape |
|--------|-------------|--------|-----------------|
| Claude | `~/.claude.json` | JSON | `mcpServers.solo = {type:"stdio", command:"<solo-mcp>", args:[], env:{}}` (Solo writes this on first install — usually already present) |
| Codex | `~/.codex/config.toml` | TOML | `[mcp_servers.solo]\ncommand = "<solo-mcp>"\nargs = []` |
| Gemini | `~/.gemini/settings.json` | JSON | `mcpServers.solo = {command:"<solo-mcp>", args:[]}` |
| Amp | TBD (only created after interactive login — `amp` first-run blocks on `Would you like to log in?`) | TBD | TBD |
| OpenCode | TBD (only created after `/connect` provider selection in TUI) | TBD | TBD |

Marked TBD = not yet validated end-to-end. First time a probe classifies one as `MCP_MISSING`, capture the working format and add it here. Do NOT guess.

### Idempotency rules for the patch step

- Read existing config first. If `solo` MCP entry already present with matching command path → skip, do not rewrite.
- Backup before any write: copy to `<file>.bak-<unix-ts>` (millisecond precision unnecessary).
- Use vendor-native config tooling where it exists. Otherwise hand-edit with surgical `Edit`/`Write` — never overwrite the whole config blindly, you will lose unrelated user settings.
- After write, re-read and parse to confirm valid syntax (TOML / JSON). Roll back from backup on parse failure.

### What preflight must NOT do

- **No auto-install of CLIs.** If `gemini` is not on PATH, surface an install hint (`npm i -g @google/gemini-cli`) and mark `CLI_MISSING`. Installing software without consent is out of scope.
- **No interactive auth flows.** Gemini's first-run "Sign in with Google / API key / Vertex" dialog is interactive and cannot be driven from a probe. Mark `NEEDS_AUTH` and tell the user to run `gemini` once manually.
- **No Trust-Folder dialog clicks.** Same reason. Hint user to set `trust_level = "trusted"` in vendor config (Codex), or accept the dialog interactively.
- **No new vendor registration in Solo's `list_agent_tools` registry.** That is a Solo-app concern.

### Footguns

- **Solo subshell uses nvm-managed Node (not your default).** A CLI installed under Node 20 is invisible to a Solo spawn that boots Node 23. Install global CLIs under the same Node version Solo uses (check `nvm current` inside a Solo terminal spawn).
- **First-run self-updates kill the process.** Codex `npm install -g` on boot, exits with "Please restart Codex". Always run a warm-up spawn (close it, spawn again) before classifying. The 2nd spawn is the real probe.
- **`send_input` text not always submitted.** Some TUIs swallow `\n`. Probe success means "the prompt actually executed", not "bytes were sent". Verify via `get_process_output` looking for tool-call evidence. Codex specifically may need a raw CR (`bytes=[13]`) follow-up.
- **MCP entry can be syntactically present but unloadable** (wrong path, wrong format, wrong field name per vendor). The probe's `whoami` call is the only ground-truth health check.
- **Probe scratchpads accumulate.** Always archive on probe exit. Tag `probe-multivendor`.

### Skipping the preflight

You may skip when:
- Workflow is single-vendor (Claude only) AND Solo's bundled Claude wiring is known-good
- You already ran preflight in the same orchestrator session and no vendor configs changed since

Otherwise: run it. The cost (~30s warm, ~60s cold) is paid back on the first prevented mid-flight stall.

## When To Skip This Skill

- Single orchestrator session, no spawns
- Terminal-only spawns (`kind="terminal"`) — no agent runtime to bind timers to
- External processes registered via `register_agent` — cannot receive timer wake-ups
- Synchronous subtask via Agent tool (different mechanism, handled by host)

## Quick Reference

| Need | Use |
|------|-----|
| Spawn will call back | Pattern B (send_input) |
| Spawn can't call back | Pattern A (idle-timer) |
| Mixed / untrusted / default | Pattern C (combo) |
| Wait for all parallel spawns | `timer_fire_when_idle_all` |
| Wait for first done | `timer_fire_when_idle_any` |
| Progress visibility mid-task | scratchpad_append |
| Terminal event signal | send_input to orch_pid |
| Multi-vendor workflow startup | Multi-Vendor Preflight (this skill) |
| Vendor config formats / Solo MCP entry shapes | Vendor config registry table above |
