import fs from 'fs/promises'
import { glob } from 'glob'
import path from 'path'
import ts from 'typescript'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function isProcessEnvAccess(node) {
  if (ts.isPropertyAccessExpression(node)) {
    // Handle process.env.VAR_NAME
    const propName = node.name?.text
    if (
      propName &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression?.text === 'process' &&
      node.expression.name?.text === 'env'
    ) {
      return propName
    }
  } else if (ts.isElementAccessExpression(node)) {
    // Handle process.env['VAR_NAME']
    const argument = node.argumentExpression
    if (
      ts.isStringLiteral(argument) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression?.text === 'process' &&
      node.expression.name?.text === 'env'
    ) {
      return argument.text
    }
  }
  return null
}

/**
 * Extracts environment variables accessed via process.env from a TypeScript/JavaScript source file
 * @param {import('typescript').SourceFile} sourceFile - The TypeScript source file to analyze
 * @returns {Set<string>} A Set containing the names of environment variables accessed in the file
 * @description Traverses the AST of the provided source file and collects all environment variable
 * references made through process.env
 */
function extractEnvVarsFromFile(sourceFile) {
  const envVars = new Set()

  function visit(node) {
    const envVar = isProcessEnvAccess(node)
    if (envVar) {
      envVars.add(envVar)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return envVars
}

/**
 * Extracts environment variables from JavaScript/TypeScript files in a directory
 * @param {string} dir - The directory path to search for files
 * @returns {Promise<string[]>} A sorted array of unique environment variable names found in the files
 * @description
 * This function:
 * - Searches for JS/TS files (including .js, .ts, .jsx, .tsx, .mjs, .cjs, .mts, .cts)
 * - Parses each file to extract environment variable references
 * - Excludes NODE_ENV from the results
 * - Logs found variables to console
 * - Returns sorted unique environment variable names
 */
async function extractJSEnvVars(dir) {
  const files = await glob(`${dir}/**/*.{js,ts,jsx,tsx,mjs,cjs,mts,cts}`, {
    absolute: true,
  })
  const envVars = new Set()

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true
    )

    const fileEnvVars = extractEnvVarsFromFile(sourceFile)
    fileEnvVars.forEach(v => envVars.add(v))
  }

  // Remove NODE_ENV from the set
  envVars.delete('NODE_ENV')
  const sortedEnvVars = Array.from(envVars).sort()

  console.log('Found environment variables:')
  sortedEnvVars.forEach(variable => console.log(`- ${variable}`))

  return sortedEnvVars
}

/**
 * Extracts environment variable names from a Webpack EnvironmentPlugin configuration node.
 * @param {import('typescript').Node} node - The AST node representing a new EnvironmentPlugin expression
 * @returns {string[]} Array of environment variable names extracted from the plugin configuration
 * @description Analyzes a TypeScript AST node for EnvironmentPlugin constructor calls and extracts
 * environment variable names from its configuration object. Only processes direct property assignments
 * in the first argument object literal.
 */
function extractEnvFromPluginConfig(node) {
  const envVars = new Set()
  if (
    ts.isNewExpression(node) &&
    node.expression.getText() === 'EnvironmentPlugin' &&
    node.arguments.length > 0
  ) {
    const arg = node.arguments[0]
    if (ts.isObjectLiteralExpression(arg)) {
      arg.properties.forEach(prop => {
        if (ts.isPropertyAssignment(prop) && prop.name) {
          envVars.add(prop.name.getText())
        }
      })
    }
  }
  return Array.from(envVars)
}

/**
 * Extracts environment variables from a Webpack configuration file
 * by analyzing the EnvironmentPlugin usage within the file.
 *
 * @async
 * @param {string} configPath - The file path to the Webpack configuration file
 * @returns {Promise<string[]>} A promise that resolves to an array of environment variable names
 * @throws {Error} If the file cannot be read or parsed
 *
 * @example
 * const envVars = await extractEnvFromWebpackConfig('./webpack.config.js');
 * console.log(envVars); // ['NODE_ENV', 'API_KEY', ...]
 */
async function extractEnvFromWebpackConfig(configPath) {
  const content = await fs.readFile(configPath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    configPath,
    content,
    ts.ScriptTarget.Latest,
    true
  )

  const envVars = new Set()

  function visit(node) {
    // Check for new EnvironmentPlugin() usage
    const vars = extractEnvFromPluginConfig(node)
    vars.forEach(v => envVars.add(v))

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return Array.from(envVars)
}

/**
 * Parses a .env file and extracts environment variable names
 * @param {string} filePath - Path to the .env file to parse
 * @returns {Promise<string[]>} Array of environment variable names found in the file
 * @throws {Error} If file reading fails, warns to console and returns empty array
 * @example
 * const envVars = await parseDevEnv('.env');
 * // Returns: ['VAR1', 'VAR2', 'API_KEY']
 */
async function parseDevEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    return lines
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0])
      .filter(Boolean)
  } catch (error) {
    console.warn(`Warning: Could not parse ${filePath}:`, error.message)
    return []
  }
}

export { extractJSEnvVars, extractEnvFromWebpackConfig, parseDevEnv }
