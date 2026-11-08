/**
 * Bundle Check Script
 * 
 * Bundles cordis core+engine to ESM for browser with React external,
 * reports minified and gzipped sizes, and greps for unsafe patterns.
 */

import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'fs'
import { gzipSync } from 'zlib'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputFile = join(__dirname, '../dist/cordis-bundle.js')

console.log('=== Cordis Bundle Check ===\n')

console.log('Building cordis bundle...')
console.log('- Target: ESM for browser')
console.log('- React: external')
console.log('- Source: cordis@4.0.0-rc.12\n')

try {
  const result = await build({
    entryPoints: [join(__dirname, '../vendor/cordis/lib/index.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    external: ['react', 'react/jsx-runtime', 'react-dom'],
    minify: true,
    outfile: outputFile,
    metafile: true
  })

  console.log('✓ Bundle created successfully\n')

  // Read the bundle
  const bundleContent = readFileSync(outputFile, 'utf-8')
  const minifiedSize = Buffer.byteLength(bundleContent, 'utf-8')
  const gzippedSize = gzipSync(bundleContent).length

  console.log('Bundle sizes:')
  console.log(`  Minified:  ${minifiedSize.toLocaleString()} bytes`)
  console.log(`  Gzipped:   ${gzippedSize.toLocaleString()} bytes\n`)

  // Check for unsafe patterns
  console.log('Checking for unsafe patterns...')
  
  const patterns = [
    { name: 'eval(', regex: /\beval\s*\(/g },
    { name: 'new Function', regex: /\bnew\s+Function\s*\(/g },
    { name: 'dynamic import()', regex: /\bimport\s*\(/g },
    { name: 'Node built-in imports', regex: /from\s+['"](?:fs|path|crypto|os|child_process|http|https|net|stream|util|events|buffer)['"]/g }
  ]

  let foundIssues = false
  for (const { name, regex } of patterns) {
    const matches = bundleContent.match(regex)
    if (matches && matches.length > 0) {
      console.log(`  ❌ Found ${matches.length} occurrence(s) of: ${name}`)
      foundIssues = true
    } else {
      console.log(`  ✓ No ${name} found`)
    }
  }

  console.log()

  if (foundIssues) {
    console.log('⚠️  WARNING: Bundle contains potentially unsafe patterns')
    console.log('   This may violate Hermes Desktop plugin catalog rules\n')
  } else {
    console.log('✅ Bundle check passed: no unsafe patterns detected\n')
  }

  // Output summary
  console.log('Summary:')
  console.log(`  Bundle: ${outputFile}`)
  console.log(`  Size: ${minifiedSize.toLocaleString()} bytes minified, ${gzippedSize.toLocaleString()} bytes gzipped`)
  console.log(`  Safe: ${!foundIssues ? 'Yes' : 'No (warnings above)'}\n`)

  // Return results as JSON for documentation
  const results = {
    version: '4.0.0-rc.12',
    minifiedBytes: minifiedSize,
    gzippedBytes: gzippedSize,
    safetyChecks: patterns.map(p => ({
      pattern: p.name,
      found: (bundleContent.match(p.regex) || []).length
    })),
    passed: !foundIssues
  }

  writeFileSync(
    join(__dirname, '../dist/bundle-check-results.json'),
    JSON.stringify(results, null, 2)
  )

  console.log('Results saved to dist/bundle-check-results.json')

  process.exit(foundIssues ? 1 : 0)

} catch (error) {
  console.error('❌ Bundle build failed:')
  console.error(error.message)
  if (error.errors) {
    console.error('\nBuild errors:')
    error.errors.forEach(err => console.error(`  - ${err.text}`))
  }
  process.exit(1)
}
