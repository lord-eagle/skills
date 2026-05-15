# Multi-Vendor Setup for Solo Brainstorm Panels

## Do you actually need this?

Read this before following any setup step below.

```
Are you spawning any non-Claude runtime (Codex / Gemini / Amp / OpenCode)?
│
├─ NO  → STOP. You need none of this.
│        Solo auto-wires Solo MCP into Claude. Single-vendor panels and
│        all push-based orchestration work out of the box. Close this doc.
│
└─ YES → Do you specifically want cross-vendor disagreement on a panel
         (different model families arguing, not just more Claude agents)?
         │
         ├─ NO  → STOP. A single-vendor (Claude) panel is enough.
         │        Multi-vendor adds setup cost and auth surface for no gain here.
         │
         └─ YES → Continue. The per-vendor setup below is for you.
                  Prefer the automated path: let `solo-orchestration`'s
                  Multi-Vendor Preflight patch configs (dry-run first).
                  This manual doc is the fallback / reference.
```

Multi-vendor is a real capability worth having for high-stakes decisions — but it is **opt-in**, not a prerequisite for using these skills. The default Claude wiring covers the common case.

---

Solo's MCP server is auto-wired only into Claude. To run brainstorm panelists on Codex, Gemini, Amp, or OpenCode you need to:

1. Install the runtime CLI (under the same Node version Solo's subshell uses)
2. Add an `mcp_servers.solo` entry to that runtime's user config
3. Complete any first-run interactive setup (auth, trust dialogs)

The `solo-orchestration` Multi-Vendor Preflight (run automatically by `solo-multi-agent-brainstorm`) does step 2 idempotently with a backup. Steps 1 and 3 are user-side — they need your consent and cannot be automated safely.

This doc is the manual fallback + reference.

---

## Solo MCP binary path

On macOS:

```
/Applications/Solo.app/Contents/MacOS/mcp
```

Use the absolute path in every vendor config. None of the non-Claude CLIs resolve `solo` from `$PATH` reliably.

---

## Per-vendor configs

### Claude Code

Already wired by Solo on first install. Verify:

```bash
python3 -c "import json; print(list(json.load(open('$HOME/.claude.json'))['mcpServers'].keys()))"
```

Should include `'solo'`. If not, Solo's installer didn't run — re-run it from the Solo app.

### Codex

File: `~/.codex/config.toml`

```toml
[mcp_servers.solo]
command = "/Applications/Solo.app/Contents/MacOS/mcp"
args = []
```

Also recommended for trusted folders (skip the trust dialog on every spawn):

```toml
[projects."/Users/<you>/path/to/project"]
trust_level = "trusted"
```

Install CLI under the same Node version Solo uses (typically Node 23 in nvm):

```bash
nvm use 23
npm install -g @openai/codex
```

**Footgun:** First spawn after install triggers `npm install -g @openai/codex` self-update and exits with "Please restart Codex". The 2nd spawn is the real one. Preflight handles this — manually you may need to spawn twice.

### Gemini

File: `~/.gemini/settings.json`

```json
{
  "mcpServers": {
    "solo": {
      "command": "/Applications/Solo.app/Contents/MacOS/mcp",
      "args": []
    }
  }
}
```

Install:

```bash
nvm use 23
npm install -g @google/gemini-cli
```

**First-run interactive:** Run `gemini` once manually before using as a panelist. You'll get:
1. Trust-folder dialog → "Trust folder" (or "Trust parent folder" for the workspace)
2. Auth picker → "Sign in with Google" / "Use API key" / "Vertex AI"

Pick one and complete the flow. After that, Gemini panelist spawns can run non-interactively.

Set `GEMINI_API_KEY` in your shell profile if you prefer API-key auth — skips the picker entirely.

### Amp (config TBD; auth required first)

Install:

```bash
nvm use 23
npm install -g @sourcegraph/amp
```

**First-run interactive:** spawning Amp without prior auth shows `Would you like to log in to Amp? [(y)es, (n)o]` and blocks. Run `amp` once manually and complete the login before treating it as a panelist runtime.

Config file location: not yet validated end-to-end (Amp does not create config files until after first interactive login). When you have completed auth and located the settings file, please open a PR adding the `mcp_servers.solo` entry shape here.

### OpenCode (config TBD; provider connection required first)

Install:

```bash
nvm use 23
npm install -g opencode-ai
```

**First-run interactive:** spawning OpenCode shows the TUI with a hint `Run /connect to add an AI provider and start coding` and waits for a provider selection. Run `opencode` once manually, run `/connect`, pick + authenticate against your provider.

Config file location: not yet validated end-to-end. Probable candidates: `~/.config/opencode/config.json` or `~/.opencode/`. PR welcome with the working snippet once verified.

---

## How the preflight uses these

When `solo-multi-agent-brainstorm` runs, `solo-orchestration` Multi-Vendor Preflight:

1. Calls `list_agent_tools()` — finds vendors registered in Solo
2. For each vendor: reads its config file, checks for `mcp_servers.solo` entry
3. If missing: writes a backup (`<file>.bak-<unix-ts>`), patches in the entry
4. Spawns each vendor in parallel, sends a probe prompt (`whoami` + write a test scratchpad), waits up to 30s
5. Classifies each:
   - `OK` — ready to use
   - `NEEDS_AUTH` — first-run dialog blocks (Gemini, Amp typically)
   - `CLI_MISSING` — binary not on Solo's subshell PATH
   - `BOOT_LOOP` — exits before accepting input (self-update)
   - `MCP_MISSING` — tools not callable even after patch (vendor wiring quirk)
   - `SUBMIT_BUG` — input not executed (TUI swallowed Enter)

Brainstorm consumes only `OK` vendors. Anything else is reported to you with the install/auth hint.

If preflight returns fewer than 2 OK vendors, an **echo-chamber warning** is surfaced before any spawn — convergence on a single vendor overstates consensus.

---

## If something goes wrong

The preflight patches user-global config files. Every write is preceded by a timestamped backup, so any patch is reversible.

### Per-vendor recovery one-liners

Restore the most recent backup, then re-run preflight:

```bash
# Codex
cp "$(ls -t ~/.codex/config.toml.bak-* | head -1)" ~/.codex/config.toml

# Gemini
cp "$(ls -t ~/.gemini/settings.json.bak-* | head -1)" ~/.gemini/settings.json

# Claude
cp "$(ls -t ~/.claude.json.bak-* | head -1)" ~/.claude.json
```

To restore a *specific* timestamp instead of the newest, list and pick:

```bash
ls -t ~/.codex/config.toml.bak-*
cp ~/.codex/config.toml.bak-1777968905 ~/.codex/config.toml
```

### How to spot a corrupted config

- The vendor CLI fails to boot, or errors on startup that referenced its config file → config likely has invalid TOML/JSON after a bad patch. Restore from backup.
- Preflight (or a re-run) classifies the vendor as `MCP_MISSING` even though an `solo` entry is visibly present in the file → the entry is shaped wrong for the current vendor schema (see the "idempotency-vs-stale-key trap" in `solo-orchestration/SKILL.md`). The probe's `whoami` is ground truth, not file presence. Restore from backup, re-derive the correct entry shape from the vendor's docs, re-patch.
- `whoami` works but `scratchpad_write` fails → not a config-corruption issue; that is an auth/permission problem, not a rollback case.

### Backup retention policy

Preflight keeps the **last 3** backups per config file. Older `.bak-<unix-ts>` files are auto-pruned at the start of the next preflight run (before the new backup is taken). If you want to keep a specific known-good backup permanently, copy it to a name without the `.bak-<ts>` pattern so the pruner ignores it.

> **Security warning:** backup files are verbatim copies of your vendor configs. If you ever hand-added an API key or token to one of these configs, the `.bak-*` copies contain that secret too. Do **not** commit, share, or paste backup files. They are local-only. Delete stale ones if the configs ever held credentials.

---

## Reset / debug

Probe a single vendor manually (assuming Solo MCP available):

```python
# In a Solo-aware agent session:
spawn_process(kind="agent", agent_tool_id=<id>, project_id=<id>, name="probe")
# send_input with: 'Call solo.whoami() then solo.scratchpad_write(...) then exit.'
# wait, get_process_output, verify
```

---

## Skipping interactive auth (env-var auth)

If you'd rather not click through Gemini / Amp / OpenCode's first-run dialogs, set the vendor's API-key env var in your shell profile (`~/.zshrc`, `~/.bashrc`, etc.). Solo passes the host environment into spawned agents, so the CLI sees the credential and boots straight into the agent layer.

```bash
# ~/.zshrc — pick the vendors you actually use
export ANTHROPIC_API_KEY="sk-ant-..."   # Claude (rarely needed; Max sessions usually authed)
export OPENAI_API_KEY="sk-..."          # Codex
export GEMINI_API_KEY="..."             # Gemini  (or GOOGLE_API_KEY for Vertex)
export AMP_API_KEY="..."                # Amp     (verify name on first success)
```

Reload your shell, then re-run preflight. Vendors that previously hit `NEEDS_AUTH` should reclassify to `OK`.

If preflight still says `NEEDS_AUTH` after setting an env var, the vendor either uses a different variable name or requires an additional one-time interactive step (e.g. OpenCode `/connect` provider selection). Run the CLI once manually to find out, and please open a PR updating this doc with the working variable name.

## Footguns recap

- **Wrong Node version.** Solo subshell uses nvm-managed Node (often Node 23). CLIs installed under your shell's default Node may be invisible. Use `nvm use 23` before `npm install -g`.
- **Self-update on first spawn.** Codex (and possibly others) do `npm install -g <self>` on first boot, exit. Preflight retries; manual users need 2 attempts.
- **Submit bug.** Some TUIs swallow `\n`. If a panelist sits with the prompt visible but never executes, send a raw CR (`bytes=[13]`).
- **Don't auto-install.** Preflight will not install missing CLIs — security boundary. Hint surfaces, you decide.
- **Don't auto-auth.** Interactive auth flows are out of scope; preflight reports `NEEDS_AUTH` and tells you to run the CLI once manually.
