# Hermes Widgets: Research Notes

Status: research only, nothing built yet. Compiled 6 Nov 2026 from a voice session with Claude plus two agent write-ups (Instinct, both instances). Items marked UNVERIFIED have not been confirmed against primary sources or real Hermes Desktop.

## TL;DR

- Build **inside Hermes Desktop** as a plugin (route 1), in this fresh repo.
- Port the **ideas** of deepWidgets, not the code. Depend on **Cordis core only**; drop DeepSeek Harness (DSH) and the deepWidgets runtime (it needs Node built-ins and cannot run in the Hermes renderer).
- The edge: **agent-created widgets that appear when their context is true and dissolve when it ends**. Existing widget plugins (home-dashboard) are fixed grids the user arranges by hand.
- **Everything hinges on one spike:** can a loaded plugin register and remove panes at runtime? If not, fall back to fixed panes shown/hidden with `when()`.

## Hackathon facts

- Hermes Agent Plugin Hackathon, Nous Research. Started 4 Nov 2026, 7 days.
- Deadline: **5 PM EST, 11 Nov 2026** = 3:30 AM IST, 12 Nov. Treat evening of 11 Nov IST as the real deadline.
- Prizes: $20,000 cash. 1st $10,000, 2nd $5,000, 3rd $2,500, 4th $1,500, 5th $1,000, five runners-up.
- Submission (secondary sources, UNVERIFIED against the official post): (1) PR to the Hermes plugin catalog pinning this repo at an exact 40-char SHA, (2) demo video under 90 s on X tagging @NousResearch, (3) form with both links.
- Judging (secondary): usefulness, reliability, polish, creativity; preference for things a prompt or Skill cannot do.
- Whether the catalog PR must be merged or only opened by the deadline: UNVERIFIED.
- Reference entry PR: NousResearch/hermes-agent#149795 (git-review, a desktop pane plugin).

## What deepWidgets actually is

From Cordis (not ours): context/fiber/effect model, revertible effects, service injection. Paper: arXiv 2608.25512, "A Programming Paradigm for Spatiotemporal Composability".

From DSH (not ours): "everything is a plugin" harness, host/renderer process split, loader, HMR, Electron shell.

Ours (the portable core):
- A `widgets` service with an action contract: per-widget FIFO queues, timeouts, schema-checked args, idempotent request IDs, typed errors, a change feed.
- Agent-authored widgets passed through gates (compile, lint, sandboxed test) before install.
- Crash blame, quarantine, watchdog, supervisor.
- A secured MCP interface for agents.
- Floating always-on-top windows per widget (Electron main) and an OpenUI Lang shell.

Portable to Hermes: action contract, change feed, idempotency, effects-with-undo, gates (as spec validation). Not portable: Electron windows, host process, Node watchdog, child-process gates, DSH loader.

Note on the vendored Cordis: both Instinct write-ups say it is rc.11 with ~21 local patches. The repo shows `vendor/cordis/package.json` as `@deepseek-ai/cordis` 4.0.6-alpha.1, and `vendor/cordis-rc11-upgrade-plan.md` is marked **proposed** (an upgrade from rc.7 with 24 patches). Needs checking. Either way, the Hermes port should use clean npm Cordis core.

## How Hermes Desktop plugins work

- A desktop plugin is one ESM file `plugin.js` default-exporting `{ id, name, register(ctx) }`, placed in `~/.hermes/desktop-plugins/<id>/`. Hot-reloads on save.
- Only `@hermes/plugin-sdk`, `react`, `react/jsx-runtime` may be imported. Everything else must be pre-bundled. Pre-bundling at publish time is fine (home-dashboard ships a prebuilt bundle).
- Every surface (panes, routes, status bar, palette, keybinds, themes) registers via `ctx.register`, which returns a disposer.
- One package can combine: `plugin.yaml` + `__init__.py` (agent tools, hooks, commands), `dashboard/plugin_api.py` (backend routes at `/api/plugins/<id>/`), `desktop/plugin.js` (reaches backend via `ctx.rest` / `ctx.socket`).
- Catalog rule 8: no eval, no `new Function`, no `import()` beyond SDK/react, no prototype patching, no reaching into app DOM.
- `ctx.socket` is a no-op on OAuth remotes: build polling from day one.
- Closing the only pane a plugin contributes disables the plugin: keep a status-bar chip as an anchor.

## Cordis -> Hermes mapping

- Temporal half (revertible effects): Hermes already does this natively via disposers. Strong fit.
- Spatial half (reactive needs/services): Hermes has no equivalent beyond `when()`. This is what Cordis adds.
- Design: one widget instance = one Cordis fiber. The fiber's effect calls `ctx.register(pane)` and returns the disposer. Needs (time, cron, session, calendar) are Cordis services; the widget spawns when they exist and dissolves when they go.
- Clashes: Hermes lifecycle is per plugin, so the plugin hosts its own fiber tree. Hot reload wipes in-memory state, so persist widgets in `ctx.storage` or the backend. Use `ctx.setTimeout` etc., never bare globals.

Instinct bundle test (npm cordis 4.0.0-rc.12, esbuild): ~30 KB minified, ~10 KB gzipped, no eval / new Function / import() / Node built-ins. Effects-with-undo and reactive inject spawn/dissolve both work in Node. Not yet run in real Hermes.

## How widgets get created and get data

Agents do **not** write code that gets hot-reloaded. They send **specs**:

1. Agent calls a tool, e.g. `widget_create(spec, needs)`.
2. Spec saved to a store (SQLite under HERMES_HOME) via the Python backend.
3. Desktop side polls/subscribes, makes a Cordis fiber, registers a pane when needs are met.
4. Needs go away -> fiber disposed -> pane gone.

Data sources:
1. Hermes's own data, read directly by the desktop: sessions, config, skills, cron, gateway events.
2. Data the agent fetches with its tools, pushed in via `widget_update`. A `post_tool_call` hook can update widgets automatically. `ctx.dispatch_tool` lets a widget action invoke other tools through normal approval.
3. Live external data: needs a refresh loop, e.g. a Hermes cron job, or a backend-polled endpoint in the spec.

Related prior art: **hermes-genui** (marketplace) and the **genui** skill render agent-provided, schema-validated UI blocks inside chat replies. Our angle: those blocks leaving the chat, living in panes, and spawning/dissolving with context. Consider reusing its block schema.

## Route 2 (standalone OS windows)

Not recommended. The SDK has no window API; it would need a spawned sidecar process (boardstate does this, disclosed), per-OS, harder to demo and review. Cheap middle option: status-bar chip plus `ctx.os` notification on spawn.

## Optics

Drop DSH from the shipped code. Credit Cordis (MIT) and deepWidgets in README/NOTICE. Precedent for DeepSeek-design ports: AirKyzzZ/hermes-superagent. No evidence either way on how judges treat DeepSeek lineage. Disclose AI co-authored commits.

## Spikes (run in order)

1. **Cordis retest** on the exact version we pin: effects cleanup and reactive spawn/dissolve. Plain Node, under an hour.
2. **Bundle check:** esbuild bundle with react/sdk external, drop into Hermes, confirm load, no CSP errors, no duplicate React, passes `hermes plugins validate`.
3. **Late registration (the crux):** register a pane from a timer after load, remove it, register another.
4. **Backend data path:** tool + `plugin_api.py` sharing SQLite, desktop polling it; log gateway event names.
5. **Pane lifecycle:** user closes a spawned pane; plugin survives thanks to a status-bar chip.
6. **Hot reload:** save the file with three widgets live; they come back from storage.

Fallback if spike 3 fails: fixed panes with `when()`. Fallback if Cordis fails in the renderer: a ~150-line mini fiber manager.

## Rough 5-day plan

- Sat 7 Nov: spikes 1-3, skeleton, build script. Go / no-go.
- Sun 8 Nov: spikes 4-6, engine with needs, store, three agent tools.
- Mon 9 Nov: 3-5 real widgets, status-bar chip, "why is this here" trail.
- Tue 10 Nov: validate clean, README, record video, open catalog PR.
- Wed 11 Nov: buffer, submit by evening IST.

## Risks

- Late registration or pane lifecycle behaves differently than assumed.
- Cordis is a release candidate: pin exactly.
- Catalog review is human and may not finish by the deadline: open the PR early.
- Scope: keep widgets declarative and few. The demo must show spawn and dissolve in the first 20 seconds.

## Sources

- deepWidgets: https://github.com/Ronitron007/deepWidgets
- Hermes Desktop Plugin SDK: https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk
- Build a Hermes Plugin: https://hermes-agent.nousresearch.com/docs/developer-guide/plugins
- Catalog submission rules: https://hermes-agent.nousresearch.com/docs/developer-guide/plugins/catalog-submission
- home-dashboard: https://hermes-agent.nousresearch.com/docs/plugins/home-dashboard
- hermes-genui: https://hermes-agent.nousresearch.com/marketplace/hermes-genui
- genui skill: https://github.com/DevvGwardo/genui
- Cordis: https://github.com/cordiverse/cordis
- Paper: https://arxiv.org/abs/2608.25512
- hermes-superagent: https://github.com/AirKyzzZ/hermes-superagent
- Entry PR precedent: https://github.com/NousResearch/hermes-agent/pull/149795
- Instinct corrected plan (private): https://files.instinct.com/wgpi5uyq51zp-hermes-widgets-port-corrected-plan
