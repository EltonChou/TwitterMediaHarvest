#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs/promises'
import { parser } from 'keep-a-changelog'
import process from 'process'

const changelogFile = process.argv[2] ?? 'CHANGELOG.md'

const stat = await fs.lstat(changelogFile)
if (!stat.isFile()) {
  console.log(`${changelogFile} is not a file.`)
  process.exit(1)
}

try {
  const file = await fs.readFile(changelogFile, 'utf-8')
  parser(file, 'UTF-8')
  console.info('✅ changelog is valid')
  process.exit(0)
} catch (error) {
  console.error(error)
  console.info('❌ changelog is invalid')
  process.exit(1)
}
