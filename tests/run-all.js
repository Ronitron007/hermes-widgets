/**
 * Test Runner for Spike 1
 * Executes all three Cordis validation tests
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const tests = [
  '01-effects-with-undo.js',
  '02-reactive-inject.js',
  '03-hermes-ctx-mock.js'
]

console.log('╔════════════════════════════════════════════════════════╗')
console.log('║  Spike 1: Cordis 4.0.0-rc.12 Validation Test Suite   ║')
console.log('╚════════════════════════════════════════════════════════╝\n')

let passed = 0
let failed = 0

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Running: ${testFile}`)
    console.log('='.repeat(60))
    
    const child = spawn('node', [join(__dirname, testFile)], {
      stdio: 'inherit',
      env: process.env
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        passed++
        console.log(`✅ ${testFile} PASSED`)
      } else {
        failed++
        console.log(`❌ ${testFile} FAILED (exit code: ${code})`)
      }
      resolve(code)
    })
    
    child.on('error', (err) => {
      failed++
      console.error(`❌ ${testFile} ERROR: ${err.message}`)
      resolve(1)
    })
  })
}

// Run all tests sequentially
for (const test of tests) {
  await runTest(test)
}

// Summary
console.log('\n' + '='.repeat(60))
console.log('TEST SUITE SUMMARY')
console.log('='.repeat(60))
console.log(`Total tests: ${tests.length}`)
console.log(`Passed: ${passed} ✅`)
console.log(`Failed: ${failed} ❌`)
console.log('='.repeat(60))

if (failed > 0) {
  console.log('\n❌ TEST SUITE FAILED\n')
  process.exit(1)
} else {
  console.log('\n✅ ALL TESTS PASSED\n')
  process.exit(0)
}
