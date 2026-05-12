# reduce-to-max

A Claude Code skill that audits a running website for information overload and proposes (or applies) editorial cuts so each page does its one job with the minimum number of sections and words required.

## What it does

- Reads a small set of declarative intent files (README, package.json description, page metadata, optional positioning docs) to learn what the product claims to be.
- Browses one or more routes on a local dev server.
- For each section: writes a one-sentence claim, flags sections it cannot summarize, detects medium mismatches (page numbers on a scroll page, terminal prompts on prose copy), and clusters redundant claims.
- For multi-page runs: detects cross-page claim duplication and scope drift.
- Produces a chat report by default; a browser overlay on opt-in; file edits only in Apply mode behind a preflight gate.

## What it does not do

- Visual redesign (typography, color, motion are secondary checks only).
- Stack migration (the skill stays in the existing idiom).
- Authoring new copy beyond minor tightening.
- Pushing or opening PRs.

## Triggers

Conversational. Examples:

- "declutter `/gaze`" — Audit mode, single route.
- "declutter `/gaze` show me" — Audit mode + browser overlay.
- "declutter `/` and `/gaze`" — Audit mode, multi-page (cross-page IA enabled).
- "declutter `/gaze` and apply" — Apply mode (preflight gate fires first).

## Install

The skill is auto-discovered when placed at `~/.claude/skills/reduce-to-max/`. No registration needed.

## Modes

| Mode    | Behaviour                                                                 |
|---------|---------------------------------------------------------------------------|
| Audit   | Browse, analyze, report. No edits.                                        |
| Propose | Audit + generate diffs. User reviews each diff before any write.          |
| Apply   | Audit + edit files directly. Requires clean git tree (or override) and a branch. |
