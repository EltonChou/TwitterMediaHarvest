#!/usr/bin/env node
import { readFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import ts from 'typescript'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Parse TypeScript declaration file and extract flag definitions
 * @param {string} content - Content of the TypeScript declaration file
 * @returns {Set<string>} Set of flag names
 */
function parseTypeScriptFlags(content) {
  const sourceFile = ts.createSourceFile(
    'flag.d.ts',
    content,
    ts.ScriptTarget.Latest,
    true
  )

  const flags = new Set()

  function visit(node) {
    if (ts.isVariableDeclaration(node)) {
      flags.add(node.name.text)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return flags
}

/**
 * Extract webpack DefinePlugin flags from configuration
 * @param {string} content - Content of the webpack configuration file
 * @returns {Set<string>} Set of flag names
 */
function parseWebpackFlags(content) {
  const sourceFile = ts.createSourceFile(
    'webpack.config.mjs',
    content,
    ts.ScriptTarget.Latest,
    true
  )

  const flags = new Set()

  function visit(node) {
    if (
      ts.isNewExpression(node) &&
      node.expression.getText().includes('DefinePlugin')
    ) {
      const defineArg = node.arguments[0]
      if (defineArg && ts.isObjectLiteralExpression(defineArg)) {
        defineArg.properties.forEach(prop => {
          if (
            ts.isPropertyAssignment(prop) &&
            prop.name.getText().match(/^__[A-Z_]+__$/)
          ) {
            flags.add(prop.name.getText())
          }
        })
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return flags
}

/**
 * Check if TypeScript flags match webpack DefinePlugin definitions
 * @param {string} flagPath - Path to TypeScript flag definitions
 * @param {string} webpackPath - Path to webpack configuration
 * @returns {Promise<boolean>} True if all flags match
 */
export async function checkFlags(flagPath, webpackPath) {
  const [flagContent, webpackContent] = await Promise.all([
    readFile(flagPath, 'utf8'),
    readFile(webpackPath, 'utf8'),
  ])

  const tsFlags = parseTypeScriptFlags(flagContent)
  const webpackFlags = parseWebpackFlags(webpackContent)

  const missingInWebpack = [...tsFlags].filter(flag => !webpackFlags.has(flag))

  if (missingInWebpack.length > 0) {
    console.error(
      'Flags defined in TypeScript but missing in webpack:',
      missingInWebpack
    )
  }

  return missingInWebpack.length === 0
}

// Execute if running as script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flagPath = resolve(__dirname, '../src/flags.d.ts')
  const webpackPath = resolve(__dirname, '../webpack.common.config.mjs')

  checkFlags(flagPath, webpackPath)
    .then(isValid => {
      if (!isValid) {
        process.exit(1)
      }
      console.log('All flags are properly defined')
    })
    .catch(error => {
      console.error('Error checking flags:', error)
      process.exit(1)
    })
}
