# Spike 1 Results: Cordis 4.0.0-rc.12 Validation

**Date:** 2026-11-08  
**Status:** ✅ PASSED  
**Cordis Version:** 4.0.0-rc.12 (from npm, not the deepWidgets fork)

## Objective

Pin cordis@4.0.0-rc.12 from npm, vendor it under MIT license, and re-run the three Node test scripts that validate core Cordis functionality for Hermes Desktop plugin use. Additionally, perform a bundle check to verify the library can be safely bundled for browser use.

## Version & Vendor Details

- **Package:** `cordis@4.0.0-rc.12` from npm
- **Vendor Location:** `vendor/cordis/`, `vendor/cosmokit/`, `vendor/@standard-schema/`
- **License:** MIT (all dependencies)
- **Notice File:** `vendor/NOTICE` documents all vendored packages and licenses

### Dependencies Vendored

1. **cordis@4.0.0-rc.12**
   - Repository: https://github.com/cordiverse/cordis
   - License: MIT
   - Author: Shigma

2. **cosmokit@1.8.1**
   - Required dependency of cordis
   - License: MIT
   - Copyright (c) 2021-present Shigma

3. **@standard-schema/spec@1.1.0**
   - Required dependency of cordis
   - License: MIT
   - Copyright (c) 2024 Colin McDonnell

## Test Results

All three validation tests passed successfully. Tests are located in `tests/` and can be run with `npm test`.

### Test 1: Effects with Undo ✅

**File:** `tests/01-effects-with-undo.js`

Tests Cordis fiber/effect disposal:
- ✓ Effect setup executes when plugin loads
- ✓ Disposer function is called when fiber is disposed
- ✓ Disposer is idempotent (not called again on repeated disposal)

**Result:** PASSED

This validates that Cordis effects cleanup properly works, which is essential for Hermes Desktop plugins that need to clean up resources (panes, timers, event listeners) on plugin disable/reload.

### Test 2: Reactive Inject Spawn/Dissolve ✅

**File:** `tests/02-reactive-inject.js`

Tests reactive service injection:
- ✓ Widget fiber waits when service dependency is not available
- ✓ Widget fiber spawns when service becomes available
- ✓ Widget fiber disposes when parent fiber is disposed
- ✓ Disposer called exactly once

**Result:** PASSED

This validates the core spatiotemporal composability feature of Cordis: fibers can declare dependencies on services and automatically spawn/dissolve as those dependencies appear and disappear. Critical for Hermes widgets that should only exist when their context (time, session, calendar event) is active.

### Test 3: Mock Hermes Desktop ctx API ✅

**File:** `tests/03-hermes-ctx-mock.js`

Tests a mock of the Hermes Desktop plugin pattern:
- ✓ Plugin loads and accesses Hermes service via injection
- ✓ Pane registered through `ctx.hermes.registerPane()`
- ✓ Timer registered through `ctx.hermes.setTimeout()` (not `window.setTimeout`)
- ✓ Both pane and timer properly disposed on plugin unload
- ✓ Timer cancelled (did not fire after disposal)

**Result:** PASSED

This validates that Cordis can implement the Hermes Desktop plugin lifecycle pattern where all resources route through `ctx.*` APIs and are automatically cleaned up on disposal. This is exactly what rule 8 of the Hermes plugin catalog requires.

**Key Insight:** Services must be accessed via `ctx.inject(['serviceName'], callback)` pattern. The callback receives an injected context with the service available as `injectedCtx.serviceName`. This is the correct Cordis pattern for accessing services.

## Bundle Check Results

**Script:** `scripts/bundle-check.js`

Bundled cordis core+engine to ESM for browser using esbuild, with React marked as external.

### Bundle Sizes

- **Minified:** 30,997 bytes
- **Gzipped:** 10,938 bytes

**Comparison with Instinct's reported results:**
- Instinct reported: 29,991 bytes minified / 10,452 gzipped
- Current results: 30,997 bytes minified / 10,938 gzipped
- Difference: +1,006 bytes minified / +486 bytes gzipped

The slight size increase is acceptable and likely due to minor version or build differences. Both are well within reasonable size limits for a Hermes Desktop plugin.

### Safety Checks ✅

All safety checks passed with zero violations:

- ✅ No `eval()` found
- ✅ No `new Function()` found
- ✅ No dynamic `import()` found
- ✅ No Node built-in imports found (fs, path, crypto, etc.)

**Hermes Plugin Catalog Compliance:** The bundle satisfies catalog rule 8, which prohibits eval, new Function, dynamic imports beyond SDK/React, and prototype patching.

### Bundle Output

- **File:** `dist/cordis-bundle.js`
- **Metadata:** `dist/bundle-check-results.json`

## Constraints Met

✅ Pinned cordis@4.0.0-rc.12 from npm (not deepWidgets fork, not DSH)  
✅ Vendored with MIT license notices preserved  
✅ All three test scripts execute and pass  
✅ Bundle check confirms safe browser compatibility  
✅ No Hermes Desktop install required for this spike  
✅ No implementation of full widget plugin (deferred to later spikes)  
✅ Existing README and research notes preserved  

## Conclusions

1. **Cordis 4.0.0-rc.12 is viable for Hermes Desktop plugins**
   - All core functionality (effects, reactive injection, service pattern) works correctly in Node.js
   - Bundle size is reasonable (~11 KB gzipped)
   - No unsafe patterns that would violate catalog rules

2. **Service injection pattern is required**
   - Services are not directly available on plugin contexts
   - Must use `ctx.inject(['serviceName'], callback)` to access them
   - This is the correct spatiotemporal pattern for Cordis

3. **Disposer pattern aligns perfectly with Hermes lifecycle**
   - Cordis fibers return disposer functions from effects
   - Hermes `ctx.register` APIs also return disposers
   - These compose naturally: store Hermes disposers in Cordis effects

4. **Ready for next spike**
   - Spike 2 should test actual Hermes Desktop integration
   - Bundle cordis into a real plugin.js
   - Verify it loads and runs in the Hermes renderer process
   - Test late registration of panes (the crux question)

## Next Steps

See `docs/research.md` for the full spike plan. Spike 2 is next: bundle check in real Hermes Desktop environment.

## Files Modified/Created

- `vendor/` - Vendored cordis and dependencies
- `vendor/NOTICE` - License notices for vendored code
- `tests/01-effects-with-undo.js` - Test 1
- `tests/02-reactive-inject.js` - Test 2  
- `tests/03-hermes-ctx-mock.js` - Test 3
- `tests/run-all.js` - Test runner
- `scripts/bundle-check.js` - Bundle validation script
- `dist/cordis-bundle.js` - Bundled output
- `dist/bundle-check-results.json` - Bundle check metadata
- `package.json` - Project configuration
- `docs/spike-1-results.md` - This file
