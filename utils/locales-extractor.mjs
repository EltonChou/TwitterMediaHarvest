#!/usr/bin/env node
/* eslint-disable no-console */
import PACKAGE from '../package.json' with { type: 'json' }
import { createHash } from 'crypto'
import dayjs from 'dayjs'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { GettextExtractor, JsExtractors } from 'gettext-extractor'
import { resolve } from 'path'
import { cwd } from 'process'

const { name, version } = PACKAGE

const extractor = new GettextExtractor()

extractor
  .createJsParser([
    JsExtractors.callExpression(['_', 'getText', 'i18n'], {
      arguments: {
        text: 0,
        context: 1,
      },
    }),
    JsExtractors.callExpression(['getTextPlural', 'plural'], {
      arguments: {
        text: 1,
        textPlural: 2,
        context: 3,
      },
    }),
  ])
  .parseFilesGlob('src/**/!(*.test).@(js|jsx|ts|tsx)')

extractor.addMessage({ text: 'appName', context: 'app' })
extractor.addMessage({
  text: 'appDesc',
  context: 'app',
})

extractor.printStats()

const dir = resolve(cwd(), 'locales')

const FILENAME = resolve(dir, 'template.pot')
const DIGEST_FILENAME = resolve(dir, 'template.pot.digest')

const savePot = () =>
  extractor.savePotFile(FILENAME, {
    ...poHeaders,
    'POT-Creation-Date': dayjs().format('YYYY-MM-DD HH:mmZZ'),
  })

const saveDigest = digest =>
  writeFileSync(DIGEST_FILENAME, digest, { encoding: 'utf-8', flag: 'w' })

/** @type {Partial<import('pofile').IHeaders>} */
const poHeaders = {
  'Project-Id-Version': `${name} (${version})`,
}

const currDigest = createHash('sha256')
  .update(extractor.getPotString(poHeaders))
  .digest('hex')

if (existsSync(DIGEST_FILENAME)) {
  const prevDigest = readFileSync(DIGEST_FILENAME, 'utf-8', 'r')

  console.info('Prev digest\t' + prevDigest)
  console.info('Curr digest\t' + currDigest + '\n')

  if (currDigest !== prevDigest) {
    console.info('Update pot file.')
    savePot()
    saveDigest(currDigest)
  } else {
    console.info('Skip updating due to same digest.')
  }
} else {
  console.info('Create pot file.')
  savePot()
  saveDigest(currDigest)
}
