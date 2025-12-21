#!/usr/bin/env node
// @ts-check
import { listPoFiles } from './libs/locales.mjs'
import chalk from 'chalk'
import { po as poParser } from 'gettext-parser'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

async function main() {
  const poFiles = await listPoFiles('./locales')

  const result = await Promise.all(poFiles.map(checkPoFile))
  if (result.some(isValid => !isValid)) process.exit(1)
  console.log(chalk.green('All translations are valid.'))
  process.exit(0)
}

/**
 * Check a single PO file for empty translations
 *
 * @param {string} poFile file path of po file
 * @returns {Promise<boolean>}
 */
async function checkPoFile(poFile) {
  try {
    const po = await fs.readFile(path.resolve(poFile))
    const content = poParser.parse(po)
    const localeCode = (content.headers['Language'] || 'unknown').replace(
      '\n',
      ''
    )

    // Check if msgstr has any empty translations
    let isValid = true
    for (const contextObj of Object.values(content.translations)) {
      for (const [msgId, translation] of Object.entries(contextObj)) {
        if (msgId === '') continue
        if (
          translation.msgstr.length === 0 ||
          translation.msgstr.every(str => str.trim() === '')
        ) {
          console.error(
            chalk.red(
              `Empty translation found in locale "${localeCode}" for msgid "${msgId}"`
            )
          )
          isValid = false
        }
      }
    }

    return isValid
  } catch (error) {
    console.error(`Error parsing PO file ${poFile}:`, error)
    return false
  }
}

await main()
