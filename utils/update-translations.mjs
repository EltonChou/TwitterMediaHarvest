#!/usr/bin/env node
import fs from 'fs/promises'
import gettextParser from 'gettext-parser'
import path from 'path'

async function updateTranslations() {
  const localesDir = path.resolve('locales')
  const templatePath = path.join(localesDir, 'template.pot')

  try {
    // Read template file
    const templateContent = await fs.readFile(templatePath)
    const template = gettextParser.po.parse(templateContent)

    // Get all .po files
    const files = await fs.readdir(localesDir)
    const poFiles = files.filter(file => file.endsWith('.po'))

    for (const poFile of poFiles) {
      const poPath = path.join(localesDir, poFile)
      console.log(`Updating ${poFile}...`)

      // Read existing translations
      const poContent = await fs.readFile(poPath)
      const poData = gettextParser.po.parse(poContent)
      // Merge translations
      const mergedTranslations = {
        charset: poData.charset,
        headers: {
          ...poData.headers,
          ...template.headers,
        },
        translations: Object.fromEntries(
          Object.entries(template.translations).map(([ctx, msgs]) => [
            ctx,
            {
              ...msgs,
              ...Object.fromEntries(
                Object.entries(poData.translations[ctx] || {}).map(
                  ([key, value]) => [
                    key,
                    {
                      ...msgs[key],
                      msgstr: value.msgstr,
                    },
                  ]
                )
              ),
            },
          ])
        ),
      }

      // Write updated file
      const output = gettextParser.po.compile(mergedTranslations)
      await fs.writeFile(poPath, output)
    }

    console.log('All translation files updated successfully!')
  } catch (error) {
    console.error('Error updating translations:', error)
  }
}

updateTranslations()
