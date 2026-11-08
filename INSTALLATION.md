# Hermes Widgets - Installation & Testing Guide

**Quick reference for installing and testing the Hermes Widgets desktop plugin**

## Installation

### Prerequisites

- Hermes Desktop v0.23.0 or later
- Node.js 18+ (for building from source)

### Quick Install (Pre-built)

```bash
# 1. Clone or download this repository
git clone https://github.com/Ronitron007/hermes-widgets
cd hermes-widgets

# 2. Checkout the widget engine branch
git checkout cursor/widget-engine-v1-6678

# 3. Install to Hermes Desktop
mkdir -p ~/.hermes/desktop-plugins/hermes-widgets
cp desktop/plugin.js ~/.hermes/desktop-plugins/hermes-widgets/

# 4. Reload plugins in Hermes Desktop
# Open Command Palette (Cmd/Ctrl+Shift+P) → "Reload desktop plugins"
# Or restart Hermes Desktop
```

### Build From Source

```bash
# 1. Clone and checkout as above

# 2. Install dependencies and build
npm install
npm run build

# 3. Install as above (step 3-4)
```

## Verification

### 1. Check Plugin Loaded

- Look for "🎛️ Widget Control" pane in your right dock
- If not visible, check **Capabilities → Plugins → hermes-widgets**
- Enable if disabled
- Check for errors in Developer Tools console (Cmd/Ctrl+Shift+I)

### 2. Test Countdown Widget

1. Click "⏱️ Countdown" in Widget Control panel
2. New pane should appear: "Countdown Timer"
3. Timer should show time remaining (e.g., "59m 30s")
4. Timer should update every second
5. Note the widget ID in the active widgets list

**Expected:** Pane docks in right area, timer counts down live

### 3. Test Notes Widget

1. Click "📝 Notes" in Widget Control panel
2. New pane should appear with empty textarea
3. Type some text
4. Wait 1 second (auto-save indicator appears briefly)
5. Text should persist

**Expected:** Pane docks, text is editable, saves automatically

### 4. Test Dissolve

1. Click "Dissolve" button on one of the widgets
2. Widget pane should disappear immediately
3. Widget should be removed from active list
4. Console should show: `[WidgetEngine] Dissolving widget <id>`

**Expected:** Pane closes, no errors in console

### 5. Test Persistence (Reload)

1. Spawn at least one widget (countdown or notes)
2. Type something in notes if using that
3. Disable the plugin (Capabilities → Plugins → hermes-widgets → Disable)
4. Both widgets should disappear
5. Console should show disposal logs
6. Re-enable the plugin
7. Widgets should reappear with same state

**Expected:** Widgets restore from storage, notes content preserved

### 6. Test Hot Reload

1. Edit `src/plugin.js` line 18 (change VERSION to '0.1.1')
2. Rebuild: `npm run build`
3. Copy new plugin.js: `cp desktop/plugin.js ~/.hermes/desktop-plugins/hermes-widgets/`
4. Reload plugins in Hermes
5. Old run should dispose, new run should start
6. Version in control panel should show "v0.1.1"

**Expected:** Clean transition, no duplicate panes

## Troubleshooting

### Plugin Won't Load

**Symptoms:** No Widget Control pane, no entry in Capabilities → Plugins

**Fixes:**
- Check file location: `~/.hermes/desktop-plugins/hermes-widgets/plugin.js`
- Directory name must match plugin id: `hermes-widgets`
- Check console for import errors
- Verify Hermes Desktop version ≥ v0.23.0

### CSP Errors

**Symptoms:** Console shows "Content Security Policy" errors

**Fixes:**
- This shouldn't happen (bundle is CSP-safe)
- If it does, file an issue with console output
- Verify you're using the built plugin.js, not source files

### React Errors

**Symptoms:** "Invalid hook call" or "duplicate React" errors

**Fixes:**
- Ensure Hermes provides React externally
- Don't bundle React in plugin.js
- Check build logs for external imports

### Widgets Don't Persist

**Symptoms:** Widgets disappear on reload

**Fixes:**
- Check if `ctx.storage` is available
- Console should show: `[WidgetEngine] Restoring N widgets from storage`
- If not, storage may not be working

### Panes Won't Disappear

**Symptoms:** Clicking Dissolve doesn't remove pane

**Fixes:**
- Check console for disposal errors
- Verify `ctx.register` returned a disposer
- Try disabling/re-enabling plugin

## Console Logs Reference

### Normal Operation

```
[hermes-widgets] Registering v0.1.0
[WidgetEngine] Restoring 0 widgets from storage
[hermes-widgets] Control panel registered
[hermes-widgets] Registration complete

// On spawn
[WidgetEngine] Spawning widget widget-1 of type countdown
[WidgetEngine] Widget widget-1 effect active
[WidgetEngine] Widget widget-1 pane registered

// On dissolve
[WidgetEngine] Dissolving widget widget-1
[WidgetEngine] Widget widget-1 effect cleanup

// On disable
[hermes-widgets] Plugin disposing
[WidgetEngine] Shutting down
```

### Errors to Watch For

- `Widget <id> not found` - Widget was already dissolved
- `Unknown widget type: <type>` - Type not registered
- `Invalid hook call` - React issue (shouldn't happen)
- CSP violations - Bundle safety issue (shouldn't happen)

## Demo Recording Tips

### For a 60-Second Demo

1. **Setup (5s):** Show Hermes Desktop with Widget Control panel visible
2. **Spawn Countdown (10s):** Click button, show new pane docking with live timer
3. **Spawn Notes (10s):** Click button, type "Hello Hermes Widgets!", show auto-save
4. **Show Active List (5s):** Pan to Widget Control, show 2 active widgets
5. **Dissolve (10s):** Click Dissolve on countdown, show pane disappearing
6. **Persistence (15s):** Disable plugin (both panes disappear), re-enable (notes pane reappears with content)
7. **Outro (5s):** Show final state, mention repo link

Total: 60 seconds, shows all key features

### Screen Recording Settings

- Resolution: 1920x1080 or 1280x720
- Frame rate: 30fps minimum
- Format: MP4 (H.264)
- Duration: < 90s per rules

### Voice Over Script

> "This is Hermes Widgets, a spatiotemporal widget system for Hermes Desktop.
> 
> Built on Cordis, widgets spawn and dissolve dynamically with their context.
> 
> [Click Countdown] Here's a live countdown timer. It updates every second using scoped intervals.
> 
> [Click Notes] And here's a persistent notes widget with auto-save.
> 
> [Show list] The control panel tracks all active widgets.
> 
> [Dissolve] Widgets dissolve cleanly with Cordis effect cleanup.
> 
> [Disable] When I disable the plugin, all widgets disappear.
> 
> [Enable] When I re-enable, they restore from storage - the notes content is still here.
> 
> One widget equals one Cordis fiber. Effects register panes, disposers remove them.
> 
> Link in description. Thank you!"

## Testing Checklist

Use this for systematic testing:

- [ ] Plugin loads without errors
- [ ] Widget Control pane appears
- [ ] Countdown widget spawns
- [ ] Countdown timer updates live
- [ ] Notes widget spawns
- [ ] Notes accepts text input
- [ ] Notes auto-saves (indicator appears)
- [ ] Active widgets list shows both
- [ ] Dissolve removes countdown pane
- [ ] Active list updates (only notes remains)
- [ ] Disable plugin removes all panes
- [ ] Console shows disposal logs
- [ ] Re-enable restores notes widget
- [ ] Notes content persisted
- [ ] Hot reload works (no duplicate panes)
- [ ] No CSP errors in console
- [ ] No React errors in console
- [ ] No memory leaks (check DevTools)

## File Locations

### Plugin

- **Installed:** `~/.hermes/desktop-plugins/hermes-widgets/plugin.js`
- **Source:** `desktop/plugin.js` (in this repo)
- **Build script:** `scripts/build-plugin.js`

### Storage

Widget state is stored in Hermes's internal storage (not a file you can inspect directly).

### Logs

Check Developer Tools console (Cmd/Ctrl+Shift+I) for all logs.

## Support

### Issues

- **Repository:** https://github.com/Ronitron007/hermes-widgets
- **PR #2:** Main widget engine implementation
- **PR #1:** Spike 1 validation (Cordis tests)

### Known Limitations

1. No agent tools yet (desktop-only for now)
2. No reactive services demo (engine supports it, widgets don't use it)
3. Only 2 widget types (countdown, notes)
4. No widget composition (single-level only)

See `docs/status.md` for complete feature matrix.

---

**Last Updated:** 2026-11-08  
**Branch:** cursor/widget-engine-v1-6678  
**Bundle Size:** 74,162 bytes (~72 KB)
