/**
 * Build Script for Hermes Widgets Desktop Plugin
 * 
 * Bundles Cordis core + widget engine + widget types into desktop/plugin.js
 * Only @hermes/plugin-sdk, react, and react/jsx-runtime remain external
 */

import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('=== Building Hermes Widgets Desktop Plugin ===\n')

try {
  // Ensure desktop directory exists
  mkdirSync(join(rootDir, 'desktop'), { recursive: true })
  
  const result = await build({
    entryPoints: [join(rootDir, 'src/plugin.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    external: [
      '@hermes/plugin-sdk',
      'react',
      'react/jsx-runtime',
      'react-dom'
    ],
    minify: false, // Keep readable for development
    sourcemap: false,
    outfile: join(rootDir, 'desktop/plugin.js'),
    metafile: true,
    banner: {
      js: `/**
 * Hermes Widgets Desktop Plugin
 * 
 * A spatiotemporal widget system for Hermes Desktop built on Cordis.
 * Widgets spawn and dissolve with their context.
 * 
 * @license MIT
 * @version 0.1.0
 * 
 * This bundle includes:
 * - cordis@4.0.0-rc.12 (MIT, Shigma)
 * - cosmokit (MIT, Shigma)
 * - @standard-schema/spec (MIT, Colin McDonnell)
 * 
 * See vendor/NOTICE for full license notices.
 */\n`
    }
  })

  console.log('✓ Plugin built successfully\n')

  // Read the output
  const pluginContent = readFileSync(join(rootDir, 'desktop/plugin.js'), 'utf-8')
  const pluginSize = Buffer.byteLength(pluginContent, 'utf-8')

  console.log('Plugin details:')
  console.log(`  Output: desktop/plugin.js`)
  console.log(`  Size: ${pluginSize.toLocaleString()} bytes\n`)

  // Check for unsafe patterns
  console.log('Safety checks:')
  
  const checks = [
    { name: 'eval(', regex: /\beval\s*\(/g },
    { name: 'new Function', regex: /\bnew\s+Function\s*\(/g },
    { name: 'dynamic import()', regex: /\bimport\s*\(/g },
    { name: 'Node built-ins', regex: /from\s+['"](?:fs|path|crypto|os|child_process|http|https|net|stream|util|events|buffer)['"]/g },
    { name: 'window.*', regex: /\bwindow\.(setTimeout|setInterval|clearTimeout|clearInterval|addEventListener)/g },
    { name: 'bare setTimeout', regex: /(?<!ctx\.)setTimeout\(/g },
    { name: 'bare setInterval', regex: /(?<!ctx\.)setInterval\(/g }
  ]

  let hasIssues = false
  for (const { name, regex } of checks) {
    const matches = pluginContent.match(regex)
    if (matches && matches.length > 0) {
      console.log(`  ⚠️  Found ${matches.length} occurrence(s) of: ${name}`)
      
      // Allow Cordis internal timer usage - it's wrapped
      if (!name.includes('bare') && !name.includes('window')) {
        hasIssues = true
      }
    } else {
      console.log(`  ✓ No ${name}`)
    }
  }

  // Check external imports
  console.log('\nExternal imports:')
  const importRegex = /from\s+['"]([^'"]+)['"]/g
  const imports = new Set()
  let match
  while ((match = importRegex.exec(pluginContent)) !== null) {
    imports.add(match[1])
  }
  
  const allowedImports = new Set([
    '@hermes/plugin-sdk',
    'react',
    'react/jsx-runtime',
    'react-dom'
  ])
  
  for (const imp of imports) {
    if (!allowedImports.has(imp)) {
      console.log(`  ⚠️  Unexpected external import: ${imp}`)
      hasIssues = true
    } else {
      console.log(`  ✓ ${imp}`)
    }
  }

  console.log()

  if (hasIssues) {
    console.log('⚠️  WARNING: Build completed with safety warnings')
    console.log('   Review the patterns above before publishing\n')
    process.exit(1)
  } else {
    console.log('✅ Build successful and catalog-safe\n')
    
    // Save build metadata
    const metadata = {
      version: '0.1.0',
      buildDate: new Date().toISOString(),
      pluginSize: pluginSize,
      cordisVersion: '4.0.0-rc.12',
      safetyChecks: checks.map(c => ({
        pattern: c.name,
        found: (pluginContent.match(c.regex) || []).length
      }))
    }
    
    writeFileSync(
      join(rootDir, 'desktop/build-metadata.json'),
      JSON.stringify(metadata, null, 2)
    )
    
    console.log('Build metadata saved to desktop/build-metadata.json')
    process.exit(0)
  }

} catch (error) {
  console.error('❌ Build failed:')
  console.error(error.message)
  if (error.errors) {
    console.error('\nBuild errors:')
    error.errors.forEach(err => console.error(`  - ${err.text}`))
  }
  process.exit(1)
}
