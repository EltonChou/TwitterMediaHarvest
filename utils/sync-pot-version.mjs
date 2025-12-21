#!/usr/bin/env node
//@ts-check
import { makeProjectIdVersion } from './libs/locales.mjs'
import chalk from 'chalk'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

console.log(`${chalk.cyan('>>')} Syncing POT file Project-Id-Version header...`)

const potFilePath = path.resolve(process.cwd(), 'locales', 'template.pot')

try {
  const potFileContent = await fs.readFile(potFilePath, 'utf-8')

  const bumpedPotFile = potFileContent.replace(
    /^"Project-Id-Version: .*\n"/,
    `"Project-Id-Version: ${makeProjectIdVersion()}\\n"`
  )

  await fs.writeFile(potFilePath, bumpedPotFile, 'utf-8')
  console.log(
    `${chalk.green('++')} Successfully synced POT file Project-Id-Version header.`
  )
  process.exit(0)
} catch (_error) {
  console.error(
    `${chalk.red('!!')} Failed to sync POT file Project-Id-Version header.`
  )
  process.exit(1)
}
