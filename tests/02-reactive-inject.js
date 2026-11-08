/**
 * Test 2: Reactive Inject Spawn/Dissolve
 * 
 * Verifies that a fiber/widget spawns when a service dependency appears
 * and dissolves when the service is removed.
 */

import { Context, Service } from '../vendor/cordis/lib/index.js'

console.log('=== Test 2: Reactive Inject Spawn/Dissolve ===\n')

// Track lifecycle events
let widgetSpawned = false
let widgetDisposed = false
let disposeCount = 0

// Create a root context
const root = new Context()

// Define a simple service
class TimeService extends Service {
  constructor(ctx) {
    super(ctx, 'time', true)  // immediate = true
  }
  
  getCurrentTime() {
    return new Date().toISOString()
  }
}

console.log('Creating dependent plugin (before service exists)...')

// Create a plugin that depends on the time service
// This should NOT spawn yet because the service doesn't exist
const dependentFiber = root.plugin((ctx) => {
  // Use inject to declare dependency
  ctx.inject(['time'], (injectedCtx) => {
    widgetSpawned = true
    console.log('Widget spawned! Time service is available.')
    console.log(`Current time: ${injectedCtx.time.getCurrentTime()}`)
    
    // Return disposer
    return () => {
      widgetDisposed = true
      disposeCount++
      console.log(`Widget disposed (count: ${disposeCount})`)
    }
  })
})

console.log('\nWaiting for initial state...')
await new Promise(resolve => setImmediate(resolve))

// Verify the widget has NOT spawned yet
if (widgetSpawned) {
  console.error('❌ FAIL: Widget should not spawn before service is provided')
  process.exit(1)
}
console.log('✓ Widget correctly waiting for service')

// Now provide the time service
console.log('\nProviding time service...')
const serviceFiber = root.plugin(TimeService)

console.log('Waiting for widget spawn...')
await new Promise(resolve => setImmediate(resolve))

// Verify the widget spawned
if (!widgetSpawned) {
  console.error('❌ FAIL: Widget should spawn when service becomes available')
  process.exit(1)
}
console.log('✓ Widget spawned when service appeared')

if (widgetDisposed) {
  console.error('❌ FAIL: Widget should not be disposed yet')
  process.exit(1)
}
console.log('✓ Widget is still active')

// Dispose the dependent plugin fiber which should trigger cleanup
console.log('\nDisposing dependent fiber (simulating service removal)...')
await dependentFiber.dispose()

console.log('Waiting for widget disposal...')
await new Promise(resolve => setImmediate(resolve))

// Verify the widget was disposed
if (!widgetDisposed) {
  console.error('❌ FAIL: Widget should be disposed when service is removed')
  process.exit(1)
}
console.log('✓ Widget disposed when service was removed')

if (disposeCount !== 1) {
  console.error(`❌ FAIL: Expected exactly 1 disposal, got ${disposeCount}`)
  process.exit(1)
}
console.log('✓ Widget disposed exactly once')

console.log('\n✅ TEST PASSED: Reactive inject spawn/dissolve works correctly\n')
