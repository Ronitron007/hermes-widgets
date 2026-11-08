/**
 * Test 3: Mock Hermes Desktop ctx API
 * 
 * Mocks the documented Hermes Desktop ctx API pattern where panes and timers
 * are registered through ctx.* (never window.* or bare globals), and confirms
 * both are disposed on plugin unload.
 */

import { Context, Service } from '../vendor/cordis/lib/index.js'

console.log('=== Test 3: Mock Hermes Desktop ctx API ===\n')

// Track registrations and disposals
const registeredPanes = []
const registeredTimers = []
let paneDisposed = false
let timerDisposed = false

// Create a mock Hermes Desktop context
class HermesDesktop extends Service {
  constructor(ctx) {
    super(ctx, 'hermes', true)
    this.panes = []
    this.timers = []
  }
  
  /**
   * Mock ctx.register for panes
   * Returns a disposer function
   */
  registerPane(paneConfig) {
    console.log(`Registering pane: ${paneConfig.id}`)
    this.panes.push(paneConfig)
    registeredPanes.push(paneConfig.id)
    
    // Return disposer
    return () => {
      console.log(`Disposing pane: ${paneConfig.id}`)
      const index = this.panes.findIndex(p => p.id === paneConfig.id)
      if (index !== -1) {
        this.panes.splice(index, 1)
        paneDisposed = true
      }
    }
  }
  
  /**
   * Mock ctx.setTimeout that routes through context, not window
   * Returns a disposer function
   */
  setTimeout(callback, delay) {
    console.log(`Registering timer with delay: ${delay}ms`)
    const timerId = globalThis.setTimeout(callback, delay)
    this.timers.push(timerId)
    registeredTimers.push(timerId)
    
    // Return disposer
    return () => {
      console.log(`Disposing timer: ${timerId}`)
      globalThis.clearTimeout(timerId)
      const index = this.timers.indexOf(timerId)
      if (index !== -1) {
        this.timers.splice(index, 1)
        timerDisposed = true
      }
    }
  }
}

// Create root context and install mock Hermes service
const root = new Context()
const hermesServiceFiber = root.plugin(HermesDesktop)

console.log('Hermes Desktop mock service installed\n')
await new Promise(resolve => setImmediate(resolve))

// Track whether plugin executed
let pluginLoaded = false
let timerFired = false

// Create a plugin that uses the Hermes ctx API
console.log('Loading plugin that uses ctx.registerPane and ctx.setTimeout...')

const pluginFork = root.plugin((ctx) => {
  console.log('Plugin loading...')
  pluginLoaded = true
  
  // Use inject to access the hermes service
  ctx.inject(['hermes'], (injectedCtx) => {
    
    // Register a pane through ctx (not directly)
    const paneDisposer = injectedCtx.hermes.registerPane({
      id: 'test-widget',
      title: 'Test Widget',
      content: 'This is a test widget'
    })
    
    // Register a timer with longer delay so we can dispose before it fires
    const timerDisposer = injectedCtx.hermes.setTimeout(() => {
      timerFired = true
      console.log('Timer fired!')
    }, 500)
    
    // Return cleanup function
    return () => {
      console.log('Plugin unload: cleaning up resources')
      paneDisposer()
      timerDisposer()
    }
  })
})

console.log('\nWaiting for plugin setup...')
await new Promise(resolve => setTimeout(resolve, 200))

// Verify plugin loaded
if (!pluginLoaded) {
  console.error('❌ FAIL: Plugin did not load')
  process.exit(1)
}
console.log('✓ Plugin loaded')

// Verify registrations
if (registeredPanes.length !== 1 || registeredPanes[0] !== 'test-widget') {
  console.error('❌ FAIL: Pane was not registered correctly')
  process.exit(1)
}
console.log('✓ Pane registered through ctx.hermes.registerPane')

if (registeredTimers.length !== 1) {
  console.error('❌ FAIL: Timer was not registered correctly')
  process.exit(1)
}
console.log('✓ Timer registered through ctx.hermes.setTimeout')

// Verify nothing disposed yet
if (paneDisposed || timerDisposed) {
  console.error('❌ FAIL: Resources should not be disposed yet')
  process.exit(1)
}
console.log('✓ Resources still active')

// Dispose the plugin (simulates unload/disable)
console.log('\nDisposing plugin (simulating unload)...')
pluginFork.dispose()

console.log('Waiting for cleanup...')
await new Promise(resolve => setImmediate(resolve))

// Verify disposals
if (!paneDisposed) {
  console.error('❌ FAIL: Pane was not disposed on plugin unload')
  process.exit(1)
}
console.log('✓ Pane disposed on unload')

if (!timerDisposed) {
  console.error('❌ FAIL: Timer was not disposed on plugin unload')
  process.exit(1)
}
console.log('✓ Timer disposed on unload')

// Verify timer did NOT fire (it was cancelled)
await new Promise(resolve => setTimeout(resolve, 100))
if (timerFired) {
  console.error('❌ FAIL: Timer fired after disposal (should have been cancelled)')
  process.exit(1)
}
console.log('✓ Timer was properly cancelled (did not fire after disposal)')

// Clean up remaining fibers
await hermesServiceFiber.dispose()

console.log('\n✅ TEST PASSED: Hermes Desktop ctx API mock works correctly')
console.log('   All resources routed through ctx.* and properly disposed on unload\n')
