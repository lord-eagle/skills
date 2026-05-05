# lord-eagle/skills

Public skill collection. Two themes:

1. **Solo MCP multi-agent orchestration** — `solo-orchestration` and `solo-multi-agent-brainstorm`. Built on [Solo MCP](https://github.com/sublayerapp/solo).
2. **GitHub PR review tooling** — `review-triage`. Independent skill, no Solo dependency.

## What's inside

### Solo multi-agent skills

- **`solo-multi-agent-brainstorm`** — Run a moderated panel of 3 AI agents on a hard decision. Mix vendors (Claude, Codex, Gemini, …) for cross-vendor disagreement. Get a synthesized verdict instead of a single-LLM hot take.
- **`solo-orchestration`** — Foundation library for any Solo multi-agent workflow. Push-based reporting (no polling), cross-project scoping, multi-vendor preflight that wires Solo MCP into Codex/Gemini/Amp/OpenCode configs.

### Standalone skills

- **`review-triage`** — Triage GitHub PR review feedback into Must fix / Should fix / Nice to have / Nit; bundles non-blocking findings into one issue per severity. **Not Solo-specific** — works on any GitHub repo with `gh` CLI access. Project board placement is opt-in per repo via `.github/review-triage.yml`; without that file, issues are created with priority labels and no project placement.

## What you get from a multi-agent brainstorm

A panel of 3 AI agents argue a decision for 3 rounds. Orchestrator synthesizes between rounds. You get a verdict that includes:

- TL;DR of the locked decisions
- Per-panelist POSITION / TOP_RISK / DELTA quoted verbatim (no smoothing-away of dissent)
- Diversity assessment — single-vendor panels are flagged as echo-chamber risk
- Token-cost estimate, panel composition, convergence trigger

Use it for: cross-repo decisions, architecture calls, anything where one LLM's opinion is not enough.

## Install

### Via [Scribe](https://github.com/lord-eagle/scribe) (recommended)

```bash
scribe install solo-orchestration solo-multi-agent-brainstorm
```

Scribe handles linking into Claude Code, Cursor, Codex, etc.

### Manual

Clone this repo, then symlink the skill directories into your agent's skills folder. For Claude Code:

```bash
git clone https://github.com/lord-eagle/skills.git ~/skills-src
ln -s ~/skills-src/solo-orchestration         ~/.claude/skills/solo-orchestration
ln -s ~/skills-src/solo-multi-agent-brainstorm ~/.claude/skills/solo-multi-agent-brainstorm
```

## Setup for multi-vendor brainstorms

Solo MCP is auto-wired only into Claude. For Codex, Gemini, Amp, or OpenCode panelists, the runtime's config needs an `mcp_servers.solo` entry.

See **[`docs/multi-vendor-setup.md`](docs/multi-vendor-setup.md)** for the per-vendor config snippets and known footguns.

The `solo-orchestration` skill includes a Multi-Vendor Preflight that patches the configs idempotently and probes each runtime — you don't need to do this by hand once the skill is loaded.

## Quickstart

After install, in Claude Code or any Solo-aware agent:

> Brainstorm with a 3-vendor panel: should I migrate from Postgres to ClickHouse for the analytics workload?

The skill picks up: `solo-multi-agent-brainstorm` runs preflight, spawns Claude + Codex + Gemini panelists (or whichever are OK), runs 3 rounds, synthesizes, archives the verdict.

## Status

- `solo-orchestration` — v1.2 (multi-vendor preflight added 2026-05-05)
- `solo-multi-agent-brainstorm` — v1.2 (multi-vendor enabled 2026-05-05)
- `review-triage` — generic GitHub-PR tooling, opt-in project placement via `.github/review-triage.yml`

Active development. Open issues track planned work:
- Mid-flight panel growth (`NEED_PANELIST`) — issue #2 Feature B
- Verdict template with DoD + reasoning trail — issue #5
- Per-round synthesis pad persistence — issue #7

## Repo layout

```
.
├── solo-orchestration/         # foundation library skill
│   ├── SKILL.md
│   └── versions/               # version snapshots
├── solo-multi-agent-brainstorm/ # panel discussion skill
│   ├── SKILL.md
│   └── versions/
├── review-triage/
└── docs/
    └── multi-vendor-setup.md   # per-vendor MCP wiring
```

Each skill is self-contained — install one without the others if you want.

## Contributing

Issues + PRs welcome. See open issues for what's planned. The Multi-Vendor Preflight footguns section (in `solo-orchestration/SKILL.md`) is a living document — if you hit a new vendor edge case, file an issue with the probe output.

## License

See LICENSE.
