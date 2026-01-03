#!/usr/bin/env node
/**
 * Translation File Updater
 *
 * This utility synchronizes translation (.po) files with the latest template structure
 * while preserving existing translations. It ensures all translation files stay in sync
 * with the template.pot file by:
 *
 * 1. Reading the master translation template (template.pot)
 * 2. Scanning for all .po translation files in the locales directory
 * 3. Merging each .po file with the template structure:
 *    - Adding new translation keys from the template
 *    - Removing obsolete keys not in the template
 *    - Preserving existing translated strings (msgstr values)
 *    - Updating headers with template metadata
 * 4. Writing the updated translations back to their respective files
 * 5. Reporting success or failure for each file processed
 *
 * This ensures translators always work with the current structure while
 * maintaining their previous translation work.
 */
import fs from 'fs/promises'
import gettextParser from 'gettext-parser'
import path from 'path'

/**
 * Reads and parses the translation template file.
 * @param {string} templatePath - Path to the template.pot file
 * @returns {Promise<import('gettext-parser').GetTextTranslations} Parsed template object
 */
async function readTemplateFile(templatePath) {
  const templateContent = await fs.readFile(templatePath)
  return gettextParser.po.parse(templateContent)
}

/**
 * Retrieves all .po files from the locales directory.
 * @param {string} localesDir - Path to the locales directory
 * @returns {Promise<string[]>} Array of .po filenames
 */
async function getPoFiles(localesDir) {
  const files = await fs.readdir(localesDir)
  return files.filter(file => file.endsWith('.po'))
}

/**
 * Merges existing translations with template structure.
 * Preserves translated strings while updating structure from template.
 * @param {import('gettext-parser').GetTextTranslations} poData - Existing translation data
 * @param {import('gettext-parser').GetTextTranslations} template - Template translation data
 * @returns {import('gettext-parser').GetTextTranslations} Merged translation object
 */
function mergeTranslationsWithTemplate(poData, template) {
  return {
    charset: poData.charset,
    headers: {
      ...poData.headers,
      ...template.headers,
    },
    translations: mergeTranslationContexts(
      poData.translations,
      template.translations
    ),
  }
}

/**
 * Merges translation contexts from existing file with template.
 * @param {import('gettext-parser').GetTextTranslations['translations']} existingTranslations - Existing translation contexts
 * @param {import('gettext-parser').GetTextTranslations['translations']} templateTranslations - Template translation contexts
 * @returns {import('gettext-parser').GetTextTranslations['translations']} Merged translation contexts
 */
function mergeTranslationContexts(existingTranslations, templateTranslations) {
  return Object.fromEntries(
    Object.entries(templateTranslations).map(([context, templateMessages]) => [
      context,
      mergeContextMessages(
        existingTranslations[context] || {},
        templateMessages
      ),
    ])
  )
}

/**
 * Merges messages within a context, preserving existing translations.
 * @param {Record<string, import('gettext-parser').GetTextTranslation>} existingMessages - Existing translated messages
 * @param {Record<string, import('gettext-parser').GetTextTranslation>} templateMessages - Template message structure
 * @returns {Record<string, import('gettext-parser').GetTextTranslation>} Merged messages with preserved translations
 */
function mergeContextMessages(existingMessages, templateMessages) {
  const preservedTranslations = Object.fromEntries(
    Object.entries(existingMessages).map(([key, value]) => [
      key,
      {
        ...templateMessages[key],
        msgstr: value.msgstr,
      },
    ])
  )

  return {
    ...templateMessages,
    ...preservedTranslations,
  }
}

/**
 * Updates a single .po file with the template structure.
 * @param {string} poPath - Path to the .po file
 * @param {import('gettext-parser').GetTextTranslations} template - Template translation data
 */
async function updatePoFile(poPath, template) {
  const poContent = await fs.readFile(poPath)
  const poData = gettextParser.po.parse(poContent)

  const mergedTranslations = mergeTranslationsWithTemplate(poData, template)

  const output = gettextParser.po.compile(mergedTranslations)
  await fs.writeFile(poPath, output)
}

/**
 * Processes all .po files and updates them with template structure.
 * @param {string} localesDir - Path to the locales directory
 * @param {string[]} poFiles - Array of .po filenames
 * @param {import('gettext-parser').GetTextTranslations} template - Template translation data
 * @returns {Promise<Set<string>>} Set of files that failed to update
 */
async function processPoFiles(localesDir, poFiles, template) {
  const failedFiles = new Set()

  for (const poFile of poFiles) {
    const poPath = path.join(localesDir, poFile)
    console.log(`🔄 Updating ${poFile}...`)

    try {
      await updatePoFile(poPath, template)
      console.log(`✅ Successfully updated ${poFile}`)
    } catch (error) {
      console.error(`❌ Failed to update ${poFile}:`, error)
      failedFiles.add(poFile)
    }
  }

  return failedFiles
}

/**
 * Reports the results of the translation update process.
 * @param {Set<string>} failedFiles - Set of files that failed to update
 */
function reportResults(failedFiles) {
  if (failedFiles.size > 0) {
    console.log(
      `⚠️  Failed to update ${Array.from(failedFiles).toString()} translation files.`
    )
  } else {
    console.log('🎉 All translation files updated successfully!')
  }
}

/**
 * Main function to update all translation files with the template structure.
 */
async function updateTranslations() {
  const localesDir = path.resolve('locales')
  const templatePath = path.join(localesDir, 'template.pot')

  try {
    const template = await readTemplateFile(templatePath)
    const poFiles = await getPoFiles(localesDir)
    const failedFiles = await processPoFiles(localesDir, poFiles, template)
    reportResults(failedFiles)
    if (failedFiles.size > 0) process.exit(1)
  } catch (error) {
    console.error('💥 Error updating translations:', error)
  }
}

updateTranslations()
