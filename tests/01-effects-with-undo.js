/**
 * Test 1: Effects with Undo
 * 
 * Verifies that Cordis fiber disposal properly calls effect disposers
 * and that disposers are idempotent.
 */

import { Context } from '../vendor/cordis/lib/index.js'

console.log('=== Test 1: Effects with Undo ===\n')

// Track disposer calls
let disposerCallCount = 0
let setupComplete = false

// Create a root context
const root = new Context()

console.log('Creating plugin with effect...')

// Create a plugin that sets up an effect
const fiber = root.plugin((ctx) => {
  console.log('Plugin loaded')
  
  // Set up an effect that returns a disposer
  ctx.effect(() => {
    setupComplete = true
    console.log('Effect setup executed')
    
    // Return disposer function
    return () => {
      disposerCallCount++
      console.log(`Disposer called (count: ${disposerCallCount})`)
    }
  })
})

console.log('\nWaiting for effect setup...')
await new Promise(resolve => setImmediate(resolve))

// Verify setup
if (!setupComplete) {
  console.error('❌ FAIL: Effect setup did not execute')
  process.exit(1)
}
console.log('✓ Effect setup complete')

// Dispose the fiber (should call disposer)
console.log('\nDisposing fiber...')
await fiber.dispose()

console.log('\nVerifying disposer execution...')
if (disposerCallCount !== 1) {
  console.error(`❌ FAIL: Expected disposer to be called once, got ${disposerCallCount} calls`)
  process.exit(1)
}
console.log('✓ Disposer called exactly once')

// Try disposing again to verify idempotency
console.log('\nDisposing again to test idempotency...')
await fiber.dispose()

if (disposerCallCount !== 1) {
  console.error(`❌ FAIL: Disposer should be idempotent, but was called ${disposerCallCount} times`)
  process.exit(1)
}
console.log('✓ Disposer is idempotent (not called again)')

console.log('\n✅ TEST PASSED: Effects with undo work correctly\n')
