#!/usr/bin/env node
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
  const args = process.argv.slice(2)
  const browserArg = args.find(arg => arg.startsWith('--browser='))

  if (!browserArg) {
    console.error('Usage: node make-releasename.mjs --browser=<browser-name>')
    process.exit(1)
  }

  const browser = browserArg.split('=')[1]
  console.log(makeReleaseName(browser))
}
