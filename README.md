# Hermes Widgets

**Hermes Agent Plugin Hackathon Entry** (Nous Research, November 2026)

Spatiotemporal widgets for Hermes Desktop: widgets that spawn and dissolve with context. Built on Cordis 4.0.0-rc.12, inspired by deepWidgets' spatiotemporal composability ideas.

## 🎯 What Makes This Different

Unlike fixed widget plugins where you manually arrange panes, Hermes Widgets uses **Cordis fiber lifecycle management** to create widgets that:

- ✨ **Spawn dynamically** when their context is active
- 💫 **Dissolve automatically** when context ends  
- 🔄 **Persist** across plugin reloads
- 🧹 **Clean up** perfectly on disable/unload

**One widget = one Cordis fiber.** Effects register panes; disposers remove them.

## 🚀 Quick Start

### Install the Plugin

```bash
# 1. Build the plugin
npm install
npm run build

# 2. Install to Hermes Desktop
mkdir -p ~/.hermes/desktop-plugins/hermes-widgets
cp desktop/plugin.js ~/.hermes/desktop-plugins/hermes-widgets/

# 3. Reload Hermes Desktop plugins
# Command Palette → "Reload desktop plugins"

# 4. Look for 🎛️ Widget Control in your right dock
```

### Use the Widgets

1. Open the **Widget Control** pane
2. Click **⏱️ Countdown** or **📝 Notes** to spawn a widget
3. Each widget appears in its own pane
4. Click **Dissolve** to remove a widget
5. Disable/re-enable the plugin - widgets restore from storage

## 📦 What's Included

- **Desktop Plugin** (`desktop/plugin.js`) - Ready to install, catalog-safe
- **Widget Engine** - Cordis-based lifecycle manager
- **Two Demo Widgets:**
  - ⏱️ **Countdown Timer** - Live countdown to a deadline
  - 📝 **Notes** - Persistent note-taking with auto-save
- **Spike 1 Validation** (PR #1) - Proves Cordis viability in Node.js

## 🏗️ Architecture

### Core Pattern

```
Widget Spawn → Cordis Fiber → ctx.effect() → ctx.register(pane) → Hermes Pane
                     ↓
Widget Dissolve → fiber.dispose() → effect undo → disposer() → Pane Removed
```

### Key Innovations

1. **Late Registration Works** - `ctx.register()` after main `register()` returns
2. **Scoped Resources** - All timers/listeners use `ctx.*` APIs, never bare globals
3. **Effect-Based Cleanup** - Cordis disposers compose with Hermes disposers
4. **Storage Integration** - Widget specs persist in `ctx.storage`

### Bundle Safety

✅ Hermes Plugin Catalog Rule 8 compliant:
- No `eval()`, `new Function()`, or dynamic `import()`
- No Node.js built-in imports
- Only imports: `@hermes/plugin-sdk`, `react`, `react/jsx-runtime`
- Cordis fully bundled (74KB total)

## 📊 Hackathon Scope

### ✅ What's Complete

- ✅ Desktop plugin with Cordis engine integrated
- ✅ Widget spawn/dissolve with proper lifecycle
- ✅ State persistence across reloads
- ✅ Two working widget types
- ✅ Control panel UI for management
- ✅ Catalog-safe bundle (no violations)
- ✅ Spike 1 validation (PR #1 - unmerged)

### 🔮 Future Enhancements

For a production-ready system, future work could add:

1. **Combined Plugin** - Add `plugin.yaml` + agent tools:
   - `widget_spawn(type, config)` - Agents create widgets
   - `widget_list()` - Query active widgets
   - `widget_dissolve(id)` - Remove widgets programmatically

2. **Reactive Services** - Widgets that spawn when dependencies appear:
   ```javascript
   ctx.inject(['calendar', 'time'], (ctx) => {
     // Widget spawns only when both services exist
     // Dissolves when either disappears
   })
   ```

3. **More Widget Types:**
   - 📅 Calendar event widgets
   - 🔔 Session/gateway listeners
   - 📊 Live data displays
   - 🤖 Agent conversation contexts

4. **Widget Composition** - Nested widgets, parent-child dependencies

## 🧪 Development

### Project Structure

```
hermes-widgets/
├── desktop/              # Built plugin
│   ├── plugin.js        # Bundled output (74KB)
│   ├── README.md        # Installation guide
│   └── build-metadata.json
├── src/                 # Source code
│   ├── plugin.js        # Main entry point
│   ├── widget-engine.js # Cordis lifecycle manager
│   └── widgets/         # Widget implementations
│       ├── countdown.js
│       └── notes.js
├── vendor/              # Vendored dependencies
│   ├── cordis/          # 4.0.0-rc.12
│   ├── cosmokit/
│   ├── @standard-schema/
│   └── NOTICE           # License notices
├── tests/               # Spike 1 validation
│   ├── 01-effects-with-undo.js
│   ├── 02-reactive-inject.js
│   └── 03-hermes-ctx-mock.js
└── docs/
    ├── research.md      # Hackathon planning notes
    └── spike-1-results.md

```

### Scripts

```bash
npm test          # Run Spike 1 validation tests
npm run build     # Build desktop plugin
npm run bundle-check  # Verify Cordis bundle safety
```

### Branches

- `main` - Project base (README, LICENSE, research)
- `cursor/spike-1-cordis-retest-6678` - PR #1 (Cordis validation, unmerged)
- `cursor/widget-engine-v1-6678` - This branch (production plugin)

## 📄 License

MIT License

**Bundled Components:**
- [Cordis 4.0.0-rc.12](https://github.com/cordiverse/cordis) (MIT, Shigma)
- [cosmokit](https://github.com/cordiverse/cosmokit) (MIT, Shigma)  
- [@standard-schema/spec](https://github.com/standard-schema/standard-schema) (MIT, Colin McDonnell)

See `vendor/NOTICE` for complete license texts.

## 🙏 Credits

- **Cordis** - [arXiv 2608.25512](https://arxiv.org/abs/2608.25512): "A Programming Paradigm for Spatiotemporal Composability"
- **Inspired by** [deepWidgets](https://github.com/Ronitron007/deepWidgets) (spatiotemporal ideas only, no code copied)
- **Built for** Hermes Desktop v0.23.0+

---

**Author:** Rohan Malik  
**Hackathon:** Hermes Agent Plugin Hackathon (Nous Research, Nov 2026)  
**Repository:** https://github.com/Ronitron007/hermes-widgets
