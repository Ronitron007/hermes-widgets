# Hermes Widgets Desktop Plugin

A spatiotemporal widget system for Hermes Desktop built on Cordis 4.0.0-rc.12.

## What is This?

Hermes Widgets brings **agent-created widgets that spawn and dissolve with context**. Unlike fixed widget plugins where you manually arrange panes, Hermes Widgets uses Cordis's spatiotemporal composability to make widgets that:

- **Spawn** when their context is true (e.g., when a deadline is near)
- **Dissolve** when their context ends (e.g., when a task completes)
- **Persist** across plugin reloads
- **Clean up** automatically on disable/unload

## Installation

### Quick Install

1. Copy `plugin.js` to your Hermes Desktop plugins directory:
   ```bash
   mkdir -p ~/.hermes/desktop-plugins/hermes-widgets
   cp desktop/plugin.js ~/.hermes/desktop-plugins/hermes-widgets/
   ```

2. Reload Hermes Desktop plugins (Command Palette → "Reload desktop plugins")

3. Look for **🎛️ Widget Control** in your right pane dock

### Manual Build

If you want to build from source:

```bash
# From the repository root
npm install
npm run build

# Then copy the built plugin.js as shown above
```

## Features

### Current Widget Types

#### ⏱️ Countdown Timer
Displays time remaining until a deadline. Updates every second with days, hours, minutes, and seconds.

**Config:**
- `deadline`: ISO timestamp of the target date/time
- `label`: Display label (default: "Countdown")

#### 📝 Notes
Simple note-taking widget with auto-save. Changes are persisted to storage after 1 second of inactivity.

**Config:**
- `title`: Widget title
- `content`: Initial note content (optional)

### Widget Control Panel

The control panel (🎛️ Widget Control) provides:
- **Spawn buttons** to create new widget instances
- **Active widget list** showing all spawned widgets
- **Dissolve buttons** to remove widgets

All widget state persists across plugin reloads.

## Architecture

### Core Concepts

**One Widget = One Cordis Fiber**

Each widget instance is backed by a Cordis fiber. The fiber's effect:
1. Registers a Hermes pane via `ctx.register()`
2. Returns a disposer function
3. When the fiber disposes, the disposer removes the pane

**Late Registration Pattern**

The plugin uses the late registration pattern proven in Spike 1:
- `ctx.register()` can be called after the plugin's main `register()` returns
- New panes dock dynamically
- Disposers work correctly

**State Persistence**

Widget specs (type, config, creation time) are saved to `ctx.storage`. On plugin reload, the engine recreates each widget's fiber and re-registers its pane.

### File Structure

```
desktop/
  plugin.js           # Bundled plugin (74KB)
  build-metadata.json # Build info
  README.md           # This file

src/
  plugin.js           # Main plugin entry point
  widget-engine.js    # Cordis-based lifecycle manager
  widgets/
    countdown.js      # Countdown widget implementation
    notes.js          # Notes widget implementation

vendor/
  cordis/             # Cordis 4.0.0-rc.12 (bundled)
  cosmokit/           # Dependency (bundled)
  @standard-schema/   # Dependency (bundled)
```

## Safety & Compliance

✅ **Hermes Plugin Catalog Rule 8 Compliant:**
- No `eval()` or `new Function()`
- No dynamic `import()` beyond SDK/React
- No Node.js built-in imports
- No bare `window.*` or global timers
- All timers/listeners use `ctx.*` scoped APIs

✅ **Only Allowed Imports:**
- `@hermes/plugin-sdk` (external)
- `react` (external)
- `react/jsx-runtime` (external)

Cordis and dependencies are fully bundled.

## Hackathon Context

This is an entry for the **Hermes Agent Plugin Hackathon** (Nous Research, Nov 2026).

**Key Innovation:** Port the spatiotemporal composability ideas from deepWidgets to Hermes Desktop without copying DSH or the deepWidgets runtime. Cordis core provides effects-with-undo and reactive service injection; Hermes Desktop provides the plugin lifecycle and pane APIs.

**What Works:**
- ✅ Widget spawn/dissolve with proper cleanup
- ✅ State persistence across reload
- ✅ Late pane registration
- ✅ Scoped timers and effects
- ✅ Catalog-safe bundle

**What's Next:**
For a full demo-ready version, future work could add:
1. Combined plugin with agent tools (`widget_spawn`, `widget_list`, `widget_dissolve`)
2. More widget types (calendar events, session contexts, gateway listeners)
3. Reactive service injection (widgets that spawn when a service appears)
4. Widget composition (nested widgets, dependencies)

## License

MIT License. See `vendor/NOTICE` for bundled dependency licenses.

**Bundled Components:**
- Cordis 4.0.0-rc.12 (MIT, Shigma)
- cosmokit (MIT, Shigma)
- @standard-schema/spec (MIT, Colin McDonnell)

## Credits

- **Cordis** paper: [arXiv 2608.25512](https://arxiv.org/abs/2608.25512) - "A Programming Paradigm for Spatiotemporal Composability"
- **Inspired by** deepWidgets (spatiotemporal ideas) - no code copied
- **Built for** Hermes Desktop v0.23.0+

---

**Entry by:** Rohan Malik  
**Repository:** https://github.com/Ronitron007/hermes-widgets  
**Spike 1 PR:** #1 (proves Cordis viability, left unmerged)
