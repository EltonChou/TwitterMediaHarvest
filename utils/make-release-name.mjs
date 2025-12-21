#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ALLOWED_BROWSERS = ['safari', 'chrome', 'edge', 'firefox']

function getPackageInfo() {
  try {
    const packagePath = resolve(__dirname, '../package.json')
    const packageData = JSON.parse(readFileSync(packagePath, 'utf8'))
    return {
      name: packageData.name,
      version: packageData.version,
    }
  } catch (_error) {
    throw new Error('Unable to read package.json')
  }
}

/**
 * Generates a formatted release name string combining package name, browser, and version
 * @param {string} browser - The browser identifier to include in the release name
 * @returns {string} Formatted string in the format "packageName(browser)@version"
 * @throws {Error} If browser parameter is not provided
 */
export function makeReleaseName(browser) {
  if (!browser) {
    throw new Error('Browser parameter is required')
  }
  const { name, version } = getPackageInfo()
  return `${name}(${browser})@${version}`
}

// Handle CLI usage
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      browser: {
        type: 'string',
        description: 'The browser identifier to include in the release name',
      },
    },
    strict: true,
  })

  if (!values.browser) {
    console.error(
      `Usage: node make-release-name.mjs --browser=<browser-name>\nAllowed browsers: ${ALLOWED_BROWSERS.join(', ')}`
    )
    process.exit(1)
  }

  if (!ALLOWED_BROWSERS.includes(values.browser)) {
    console.error(
      `Invalid browser: ${values.browser}\nAllowed browsers: ${ALLOWED_BROWSERS.join(', ')}`
    )
    process.exit(1)
  }

  console.log(makeReleaseName(values.browser))
}
